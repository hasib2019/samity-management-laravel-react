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
            
            // Calculate total unpaid fine from schedules
            $totalUnpaidFine = $loan->schedules->sum(function ($schedule) {
                return $schedule->fine_amount - $schedule->paid_fine;
            });

            // Check if LoanAccount exists for accurate balance
            $loanAcc = LoanAccount::where('loan_application_id', $loan->id)->first();
            
            if ($loanAcc) {
                // Current Balance (Principal + Interest) + Unpaid Fines
                $loan->total_due = $loanAcc->current_balance + $totalUnpaidFine;
                $loan->total_paid = $loanAcc->total_paid;
                $loan->account_no = $loanAcc->account_no;
            } else {
                // Fallback to calculation
                // Sum of (Total Amount - Paid Amount) + Unpaid Fines
                // Note: total_amount is P+I. paid_amount is P+I+Fine (historically) or P+I+Fine (now)
                // Actually safer to calculate from components:
                
                $pendingPrincipalInterest = $loan->schedules->sum(function ($s) {
                    return ($s->principal_amount + $s->interest_amount) - ($s->paid_principal + $s->paid_interest);
                });

                $loan->total_due = $pendingPrincipalInterest + $totalUnpaidFine;
                
                $loan->total_paid = LoanRepaymentSchedule::where('loan_application_id', $loan->id)
                    ->where('status', 'paid')
                    ->sum('paid_amount'); // This is approximation for fallback
            }
            
            // Expose fine component explicitly for frontend if needed
            $loan->total_fine_due = $totalUnpaidFine;
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
        $finePaid = 0;

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

                // Calculate pending amounts
                // Note: paid_amount includes principal + interest + fine
                // But we store paid_fine explicitly now
                $alreadyPaidFine = $schedule->paid_fine; 
                
                $pendingFine = $schedule->fine_amount - $alreadyPaidFine;
                $pendingFine = max(0, $pendingFine);

                $pendingInterest = $schedule->interest_amount - $schedule->paid_interest;
                $pendingPrincipal = $schedule->principal_amount - $schedule->paid_principal;

                $totalPendingForSchedule = $pendingFine + $pendingInterest + $pendingPrincipal;

                if ($totalPendingForSchedule <= 0) {
                     // If for some reason status is not paid but amounts are 0, mark paid
                    $schedule->status = 'paid';
                    $schedule->save();
                    continue; 
                }

                $payForThisSchedule = min($remainingAmount, $totalPendingForSchedule);
                $paymentLeft = $payForThisSchedule;
                
                // Distribute Payment: Fine -> Interest -> Principal
                
                $fineComponent = 0;
                $interestComponent = 0;
                $principalComponent = 0;

                // 1. Pay Fine
                if ($paymentLeft > 0 && $pendingFine > 0) {
                    $amountToPay = min($paymentLeft, $pendingFine);
                    $fineComponent = $amountToPay;
                    $paymentLeft -= $amountToPay;
                }

                // 2. Pay Interest
                if ($paymentLeft > 0 && $pendingInterest > 0) {
                    $amountToPay = min($paymentLeft, $pendingInterest);
                    $interestComponent = $amountToPay;
                    $paymentLeft -= $amountToPay;
                }

                // 3. Pay Principal
                if ($paymentLeft > 0 && $pendingPrincipal > 0) {
                    $amountToPay = min($paymentLeft, $pendingPrincipal);
                    $principalComponent = $amountToPay;
                    $paymentLeft -= $amountToPay;
                }
                
                // Update Schedule
                $schedule->paid_amount += $payForThisSchedule;
                $schedule->paid_interest += $interestComponent;
                $schedule->paid_principal += $principalComponent;
                $schedule->paid_fine += $fineComponent;
                
                $principalPaid += $principalComponent;
                $interestPaid += $interestComponent;
                $finePaid += $fineComponent;

                // Check if fully paid
                // We compare paid_amount with total required (total_amount + fine_amount)
                // Note: total_amount in DB usually is principal + interest. fine is separate.
                $requiredTotal = $schedule->total_amount + $schedule->fine_amount;
                
                if ($schedule->paid_amount >= $requiredTotal - 0.01) {
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
                // Update LoanAccount with Principal + Interest only
                // Fines are tracked in schedules and do not reduce the core loan balance
                $corePayment = $principalPaid + $interestPaid;
                
                $loanAccount->total_paid += $corePayment;
                $loanAccount->principal_paid += $principalPaid;
                $loanAccount->interest_paid += $interestPaid;
                $loanAccount->current_balance -= $corePayment;
                
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
            $cashGlId = $loan->product->loan_cash_bank_cr_gl_id;
            if (!$cashGlId) {
                $cashMap = GlMstMapping::where('gl_code_type', 'CASH')->where('status', true)->first();
                $cashGlId = $cashMap ? $cashMap->gl_mst_id : null;
            }
            if (!$cashGlId) {
                throw new \Exception("Loan Cash/Bank Cr GL not defined");
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
                'glac_id' => $cashGlId,
                'dr_amt' => $amount,
                'cr_amt' => 0,
            ]));

            // Credit Transaction (Principal -> Asset)
            // User requested: "Loan Outstanding GL (Dr GL) this gl is Cr and this is principal amount"
            if ($principalPaid > 0) {
                if (!$loan->product->loan_portfolio_dr_gl_id) {
                     throw new \Exception("Loan Portfolio Dr GL not defined");
                }
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $loan->product->loan_portfolio_dr_gl_id,
                    'dr_amt' => 0,
                    'cr_amt' => $principalPaid,
                    'naration' => ($request->naration ?? 'Loan Repayment') . ' (Principal)',
                ]));
            }

            // Credit Transaction (Interest -> Income)
            // User requested: "Profit/Interest GL have gl CR is service charge"
            if ($interestPaid > 0) {
                if (!$loan->product->loan_interest_income_cr_gl_id) {
                     throw new \Exception("Loan Interest Income Cr GL not defined");
                }
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $loan->product->loan_interest_income_cr_gl_id,
                    'dr_amt' => 0,
                    'cr_amt' => $interestPaid,
                    'naration' => ($request->naration ?? 'Loan Repayment') . ' (Interest)',
                ]));
            }

            // Credit Transaction (Penalty -> Income)
            // User requested: "Penalty GL overdue gl CR"
            if ($finePaid > 0) {
                if (!$loan->product->loan_penalty_income_cr_gl_id) { 
                     throw new \Exception("Loan Penalty Income Cr GL not defined");
                }
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $loan->product->loan_penalty_income_cr_gl_id,
                    'dr_amt' => 0,
                    'cr_amt' => $finePaid,
                    'naration' => ($request->naration ?? 'Loan Repayment') . ' (Penalty)',
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
