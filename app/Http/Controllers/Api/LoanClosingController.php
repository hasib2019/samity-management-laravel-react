<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LoanApplication;
use App\Models\LoanRepaymentSchedule;
use App\Models\LoanAccount;
use App\Models\Transaction;
use App\Models\GlMstMapping;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LoanClosingController extends Controller
{
    // Search for active loans to close
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string', // account_no or member_code
        ]);

        $term = $request->query('query');

        // Find Active Loan
        $loanQuery = LoanApplication::with(['member', 'product', 'samity'])
            ->where('status', 'disbursed'); // Only disbursed loans can be closed

        // Try searching by Loan Account No
        $loanAccount = LoanAccount::where('account_no', $term)->first();
        
        if ($loanAccount) {
            $loanQuery->where('id', $loanAccount->loan_application_id);
        } else {
            // Try by Member Code
            $loanQuery->whereHas('member', function($q) use ($term) {
                $q->where('member_code', $term);
            });
        }

        $loan = $loanQuery->first();

        if (!$loan) {
            return response()->json(['message' => 'Active Loan not found'], 404);
        }

        // Calculate Closing Info
        // 1. Outstanding Principal & Interest
        // We can get this from LoanAccount if maintained, or sum unpaid schedules.
        // Better to use LoanAccount for balance accuracy.
        
        $loanAccount = LoanAccount::where('loan_application_id', $loan->id)->first();
        
        if (!$loanAccount) {
             return response()->json(['message' => 'Loan Account Record missing'], 500);
        }

        // Outstanding Balance (Principal + Interest typically stored in current_balance)
        // If current_balance includes Interest, then we are good.
        // Assuming current_balance = Remaining Principal + Remaining Interest.
        
        $outstandingBalance = $loanAccount->current_balance;

        // 2. Unpaid Fines
        // Sum of (fine_amount - paid_fine) from schedules
        $unpaidFines = LoanRepaymentSchedule::where('loan_application_id', $loan->id)
            ->sum(DB::raw('fine_amount - paid_fine'));

        // 3. Total Due
        $totalDue = $outstandingBalance + $unpaidFines;

        // 4. Breakdown (Optional but helpful)
        // We can try to estimate Principal vs Interest split if needed, 
        // but for closing, we mainly care about total collectible.
        
        return response()->json([
            'loan' => $loan,
            'account' => $loanAccount,
            'closing_info' => [
                'outstanding_balance' => $outstandingBalance,
                'unpaid_fines' => $unpaidFines,
                'total_due' => $totalDue,
            ]
        ]);
    }

    // Process Loan Closing
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'loan_id' => 'required|exists:loan_applications,id',
            'closing_date' => 'required|date',
            'collected_amount' => 'required|numeric|min:0',
            'waiver_amount' => 'nullable|numeric|min:0',
            'naration' => 'nullable|string',
            'payment_mode' => 'required|string|in:cash,bank', // Add bank later if needed
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $loan = LoanApplication::with(['product', 'member'])->findOrFail($request->loan_id);
            $loanAccount = LoanAccount::where('loan_application_id', $loan->id)->firstOrFail();

            if ($loan->status !== 'disbursed') {
                throw new \Exception("Loan is not active");
            }

            // Calculations
            $outstandingBalance = $loanAccount->current_balance;
            $unpaidFines = LoanRepaymentSchedule::where('loan_application_id', $loan->id)
                ->sum(DB::raw('fine_amount - paid_fine'));
            
            $totalDue = $outstandingBalance + $unpaidFines;
            $collected = $request->collected_amount;
            $waiver = $request->waiver_amount ?? 0;

            // Validate amounts
            // Collected + Waiver should cover Total Due?
            // Usually yes, or we are writing off the rest?
            // Let's assume strict closing: Collected + Waiver = Total Due.
            // Or allow partial? No, closing means zeroing out.
            
            if (abs(($collected + $waiver) - $totalDue) > 1.00) { // Allow 1 taka tolerance
                throw new \Exception("Collected amount + Waiver must equal Total Due ($totalDue)");
            }

            // Update Loan Status
            $loan->status = 'closed';
            $loan->updated_by = Auth::id();
            $loan->save();

            // Update Loan Account
            $loanAccount->current_balance = 0; // Zero out
            $loanAccount->total_paid += $collected;
            $loanAccount->status = 'closed';
            $loanAccount->save();

            // Mark all schedules as paid
            LoanRepaymentSchedule::where('loan_application_id', $loan->id)
                ->update(['status' => 'paid']); // Or 'closed'


            // GL Transactions
            $batch = 'LCL' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            $commonData = [
                'samity_id' => $loan->samity_id,
                'customer_id' => $loan->member_id,
                'product_id' => $loan->product_id,
                'payment_mode' => $request->payment_mode,
                'batch_num' => $batch,
                'tran_code' => 'COL', // Collection
                'tran_type' => 'LoanClosing',
                'tran_date' => $request->closing_date,
                'naration' => $request->naration ?? 'Loan Closing',
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
                'status' => 'posted'
            ];

            // 1. Debit Cash (Collected Amount)
            $cashGlId = $loan->product->loan_cash_bank_cr_gl_id;
            if (!$cashGlId) {
                $cashMap = GlMstMapping::where('gl_code_type', 'CASH')->where('status', true)->first();
                $cashGlId = $cashMap ? $cashMap->gl_mst_id : null;
            }
            if (!$cashGlId) throw new \Exception("Loan Cash/Bank Cr GL not found");

            if ($collected > 0) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $cashGlId,
                    'dr_amt' => $collected,
                    'cr_amt' => 0,
                ]));
            }

            // 2. Credit Loan Portfolio (Principal) - Reduce Asset
            // Note: Total Due includes Principal + Interest + Fine.
            // We need to split the Credit.
            // BUT, usually in simplified systems, "Portfolio" tracks Principal only?
            // OR "Portfolio" tracks P+I?
            // In our repayment flow, we credit the product's loan portfolio GL for the reduction amount.
            // Let's check LoanRepaymentController...
            // It credits the product's configured loan portfolio GL with the repayment reduction amount.
            // This implies the Asset GL tracks the full outstanding balance.
            // So we Credit Asset GL with (Collected + Waiver).
            // Wait, if we waive, we are reducing asset but not getting cash.
            // Waiver is an Expense (Loss).
            
            // Credit Asset (Total Due)
            if ($loan->product->loan_portfolio_dr_gl_id) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(11, 99),
                    'glac_id' => $loan->product->loan_portfolio_dr_gl_id,
                    'dr_amt' => 0,
                    'cr_amt' => $totalDue, // Reducing the full asset balance
                ]));
            } else {
                 throw new \Exception("Loan Portfolio Dr GL not defined");
            }

            // 3. Debit Waiver Expense (if any)
            if ($waiver > 0) {
                // Priority 1: Product specific Waiver GL
                $waiverGlId = $loan->product->loan_waiver_exp_dr_gl_id;

                // Priority 2: Global Waiver Mapping
                if (!$waiverGlId) {
                    $waiverMap = GlMstMapping::where('gl_code_type', 'WAIVER')->first();
                    $waiverGlId = $waiverMap ? $waiverMap->gl_mst_id : null;
                }

                if ($waiverGlId) {
                    Transaction::create(array_merge($commonData, [
                        'tran_num' => date('YmdHis') . rand(12, 99),
                        'glac_id' => $waiverGlId,
                        'dr_amt' => $waiver,
                        'cr_amt' => 0,
                    ]));
                } else {
                    // Priority 3: Debit Interest Income (Revenue Reversal) as fallback
                    if ($loan->product->loan_interest_income_cr_gl_id) {
                         Transaction::create(array_merge($commonData, [
                            'tran_num' => date('YmdHis') . rand(12, 99),
                            'glac_id' => $loan->product->loan_interest_income_cr_gl_id,
                            'dr_amt' => $waiver, // Debit Income = Reduce Income
                            'cr_amt' => 0,
                        ]));
                    } else {
                        throw new \Exception("Cannot post Waiver: No Waiver GL or Profit GL found to debit.");
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Loan Closed successfully',
                'batch' => $batch
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Closing failed: ' . $e->getMessage()], 500);
        }
    }
}
