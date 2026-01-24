<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LoanApplication;
use App\Models\LoanRepaymentSchedule;
use App\Models\LoanAccount;
use App\Models\Transaction;
use App\Models\GlMstMapping;
use App\Models\MemberInfo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LoanRepaymentController extends Controller
{
    // List recent repayments
    public function index(Request $request)
    {
        $query = Transaction::with(['member', 'samity', 'product'])
            ->where('tran_type', 'LoanRepayment')
            ->latest();

        if ($request->has('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        if ($request->has('date')) {
            $query->whereDate('tran_date', $request->date);
        }

        return response()->json($query->paginate(20));
    }

    // Search active loans
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'search_term' => 'required|string', // member_code or account_no (loan ID?)
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Search term is required'], 400);
        }

        $term = $request->search_term;

        // Try to find by Account No first (LoanAccount)
        $account = LoanAccount::with(['loanApplication.member', 'loanApplication.product', 'loanApplication.samity'])
            ->where('account_no', $term)
            ->first();

        if ($account) {
            $loans = collect([$account->loanApplication]);
        } else {
            // Find member first
            $member = MemberInfo::where('member_code', $term)->first();
            
            $query = LoanApplication::with(['member', 'product', 'samity'])
                ->where('status', 'disbursed') // Only active/disbursed loans
                ->where(function($q) use ($term, $member) {
                    if ($member) {
                        $q->where('member_id', $member->id);
                    } else {
                        $q->where('id', $term); // Assume term is loan ID if not member code
                    }
                });

            $loans = $query->get();
        }

        // Attach unpaid schedules and Balance info
        foreach ($loans as $loan) {
            $loan->schedules = LoanRepaymentSchedule::where('loan_application_id', $loan->id)
                ->where('status', '!=', 'paid')
                ->orderBy('due_date', 'asc')
                ->get();
            
            // Check if LoanAccount exists for accurate balance
            $loanAcc = LoanAccount::where('loan_application_id', $loan->id)->first();
            
            if ($loanAcc) {
                $loan->total_due = $loanAcc->current_balance;
                $loan->total_paid = $loanAcc->total_paid;
                $loan->account_no = $loanAcc->account_no;
            } else {
                // Fallback to calculation
                $loan->total_due = $loan->schedules->sum('total_amount');
                $loan->total_paid = LoanRepaymentSchedule::where('loan_application_id', $loan->id)
                    ->where('status', 'paid')
                    ->sum('total_amount');
            }
        }

        return response()->json($loans);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'loan_id' => 'required|exists:loan_applications,id',
            'amount' => 'required|numeric|min:1',
            'tran_date' => 'required|date',
            'naration' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $loan = LoanApplication::with('product')->find($request->loan_id);
        
        if ($loan->status !== 'disbursed') {
            return response()->json(['message' => 'Loan is not disbursed/active'], 400);
        }

        $amount = (float) $request->amount;
        $remainingAmount = $amount;
        $principalPaid = 0;
        $interestPaid = 0;

        try {
            DB::beginTransaction();

            // Get unpaid schedules
            $schedules = LoanRepaymentSchedule::where('loan_application_id', $loan->id)
                ->where('status', '!=', 'paid')
                ->orderBy('due_date', 'asc')
                ->get();

            if ($schedules->isEmpty()) {
                return response()->json(['message' => 'No pending schedules found'], 400);
            }

            foreach ($schedules as $schedule) {
                if ($remainingAmount <= 0) break;

                $pendingAmount = $schedule->total_amount - $schedule->paid_amount;
                
                if ($pendingAmount <= 0) {
                    continue; // Should not happen given query, but safety check
                }

                $payForThisSchedule = min($remainingAmount, $pendingAmount);
                
                // Distribute between Interest and Principal
                // Priority: Interest first
                $pendingInterest = $schedule->interest_amount - $schedule->paid_interest;
                $pendingPrincipal = $schedule->principal_amount - $schedule->paid_principal;

                $interestComponent = 0;
                $principalComponent = 0;

                if ($payForThisSchedule <= $pendingInterest) {
                    $interestComponent = $payForThisSchedule;
                } else {
                    $interestComponent = $pendingInterest;
                    $principalComponent = $payForThisSchedule - $pendingInterest;
                }
                
                // Safety cap on principal (rounding errors)
                if ($principalComponent > $pendingPrincipal) {
                    $principalComponent = $pendingPrincipal;
                    // Any excess? Should be 0 if math is right
                }

                // Update Schedule
                $schedule->paid_amount += $payForThisSchedule;
                $schedule->paid_interest += $interestComponent;
                $schedule->paid_principal += $principalComponent;
                
                $principalPaid += $principalComponent;
                $interestPaid += $interestComponent;

                if ($schedule->paid_amount >= $schedule->total_amount - 0.01) {
                    $schedule->status = 'paid';
                    $schedule->paid_date = $request->tran_date;
                } else {
                    $schedule->status = 'partial';
                }
                $schedule->save();

                $remainingAmount -= $payForThisSchedule;
            }

            // Update LoanAccount Balance
            $loanAccount = LoanAccount::where('loan_application_id', $loan->id)->first();
            if ($loanAccount) {
                $loanAccount->total_paid += ($amount - $remainingAmount); // Total actual paid in this session
                $loanAccount->principal_paid += $principalPaid;
                $loanAccount->interest_paid += $interestPaid;
                $loanAccount->current_balance -= ($amount - $remainingAmount);
                
                if ($loanAccount->current_balance <= 0) {
                    $loanAccount->status = 'closed';
                    $loanAccount->closed_date = $request->tran_date;
                }
                
                $loanAccount->save();
            }

            // If we have remaining amount, it might be advance payment or error.
            // For now ignore excess.

            // GL Entries
            // 1. Debit Cash (Receive Money)
            $cashMap = GlMstMapping::where('gl_code_type', 'CASH')->where('status', true)->first();
            if (!$cashMap) {
                throw new \Exception("Cash GL Mapping not found");
            }
            
            // Generate Batch
            $batch = 'LR' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);

            // Common Transaction Data
            $commonData = [
                'samity_id' => $loan->samity_id,
                'customer_id' => $loan->member_id, // Member as customer
                'product_id' => $loan->product_id,
                'payment_mode' => 'cash',
                'batch_num' => $batch,
                'tran_code' => 'COL', // Collection
                'tran_type' => 'LoanRepayment',
                'tran_date' => $request->tran_date,
                'naration' => $request->naration ?? 'Loan Repayment',
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
                'status' => 'posted'
            ];

            // Debit Transaction (Cash)
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $cashMap->gl_mst_id,
                'dr_amt' => $amount,
                'cr_amt' => 0,
            ]));

            // Credit Transaction (Principal -> Asset)
            if ($principalPaid > 0) {
                if (!$loan->product->gl_principal_id) { // Use portfolio/principal GL
                     throw new \Exception("Product Principal GL not defined");
                }
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $loan->product->gl_principal_id,
                    'dr_amt' => 0,
                    'cr_amt' => $principalPaid,
                    'naration' => ($request->naration ?? 'Loan Repayment') . ' (Principal)',
                ]));
            }

            // Credit Transaction (Interest -> Income)
            if ($interestPaid > 0) {
                if (!$loan->product->gl_income_id) { // Use income GL
                     throw new \Exception("Product Income GL not defined");
                }
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $loan->product->gl_income_id, // Interest Income GL
                    'dr_amt' => 0,
                    'cr_amt' => $interestPaid,
                    'naration' => ($request->naration ?? 'Loan Repayment') . ' (Interest)',
                ]));
            }

            // Update Loan Status if fully paid
            // Check if all schedules are paid
            $pendingSchedules = LoanRepaymentSchedule::where('loan_application_id', $loan->id)
                ->where('status', '!=', 'paid')
                ->count();
            
            if ($pendingSchedules == 0) {
                $loan->status = 'closed'; // or 'paid'
                $loan->save();
            }

            DB::commit();
            return response()->json(['message' => 'Repayment successful', 'batch' => $batch]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Repayment failed: ' . $e->getMessage()], 500);
        }
    }
}
