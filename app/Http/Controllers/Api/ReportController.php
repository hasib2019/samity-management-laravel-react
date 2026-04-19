<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GlAccount;
use App\Models\Transaction;
use App\Models\SavingsAccount;
use App\Models\LoanAccount;
use App\Models\MemberInfo;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Generate Account Statement
     */
    public function accountStatement(Request $request)
    {
        $request->validate([
            'type' => 'required|in:savings,loan',
            'account_id' => 'required|integer',
            'date_from' => 'required|date',
            'date_to' => 'required|date',
        ]);

        $type = $request->type;
        $accountId = $request->account_id;
        $from = $request->date_from;
        $to = $request->date_to;

        $transactions = [];
        $openingBalance = 0;
        $accountInfo = null;

        if ($type === 'savings') {
            $account = SavingsAccount::with(['member', 'product'])->find($accountId);
            if (!$account) {
                return response()->json(['message' => 'Account not found'], 404);
            }
            $accountInfo = $account;

            // For Savings: customer_id is the Account ID
            // Balance is Liability (Cr - Dr)
            // Opening Balance
            $opStats = Transaction::where('customer_id', $accountId)
                ->where('tran_date', '<', $from)
                ->where('status', 'posted')
                ->select(DB::raw('SUM(dr_amt) as dr'), DB::raw('SUM(cr_amt) as cr'))
                ->first();
            
            $openingBalance = ($opStats->cr ?? 0) - ($opStats->dr ?? 0);

            // Transactions
            $transactions = Transaction::where('customer_id', $accountId)
                ->whereBetween('tran_date', [$from, $to])
                ->where('status', 'posted')
                ->orderBy('tran_date')
                ->orderBy('id')
                ->get();

        } else {
            $account = LoanAccount::with(['member', 'loanApplication.product'])->find($accountId);
            if (!$account) {
                return response()->json(['message' => 'Account not found'], 404);
            }
            $accountInfo = $account;
            $memberId = $account->member_id;
            $productId = $account->loanApplication->product_id;

            // For Loans: customer_id is Member ID
            // We filter by Product ID to isolate this loan type
            // Balance is Asset (Dr - Cr) usually, but "Current Balance" in LoanAccount tracks (Principal + Interest)
            // Disbursement: Dr Loan Portfolio (Asset)
            // Repayment: Cr Loan Portfolio (Asset) AND Cr Interest Income (Income)
            // Both reduce the "amount user owes".
            
            // So logic: Dr (Disbursement) increases balance. Cr (Repayment) decreases balance.
            
            $opStats = Transaction::where('customer_id', $memberId)
                ->where('product_id', $productId)
                ->where('tran_date', '<', $from)
                ->where('status', 'posted')
                ->select(DB::raw('SUM(dr_amt) as dr'), DB::raw('SUM(cr_amt) as cr'))
                ->first();

            $openingBalance = ($opStats->dr ?? 0) - ($opStats->cr ?? 0);

            $transactions = Transaction::where('customer_id', $memberId)
                ->where('product_id', $productId)
                ->whereBetween('tran_date', [$from, $to])
                ->where('status', 'posted')
                ->orderBy('tran_date')
                ->orderBy('id')
                ->get();
        }

        return response()->json([
            'account' => $accountInfo,
            'opening_balance' => $openingBalance,
            'transactions' => $transactions
        ]);
    }

    /**
     * Generate Balance Sheet
     */
    public function balanceSheet(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
        ]);

        $date = $request->date;
        $samityId = $request->samity_id;

        // Fetch GL Accounts with balances
        $glAccounts = GlAccount::where('parent_child', 'C')
            ->orderBy('glac_code')
            ->get();

        $query = Transaction::query()
            ->select(
                'glac_id',
                DB::raw('SUM(dr_amt) as total_dr'),
                DB::raw('SUM(cr_amt) as total_cr')
            )
            ->where('tran_date', '<=', $date)
            ->where('status', 'posted');

        if ($samityId) {
            $query->where('samity_id', $samityId);
        }

        $balances = $query->groupBy('glac_id')->get()->keyBy('glac_id');

        $assets = [];
        $liabilities = [];
        $totalAssets = 0;
        $totalLiabilities = 0;
        
        $totalIncome = 0;
        $totalExpense = 0;

        foreach ($glAccounts as $gl) {
            $dr = 0;
            $cr = 0;
            
            if (isset($balances[$gl->id])) {
                $dr = $balances[$gl->id]->total_dr ?? 0;
                $cr = $balances[$gl->id]->total_cr ?? 0;
            }

            // Calculate Balance based on Type
            // 1: Asset (Dr), 2: Liability (Cr), 3: Income (Cr), 4: Expense (Dr)
            
            $balance = 0;
            
            if ($gl->glac_type == 1) { // Asset (Dr Nature)
                $balance = $dr - $cr;
                if ($balance != 0) {
                    $assets[] = [
                        'code' => $gl->glac_code,
                        'name' => $gl->glac_name,
                        'balance' => $balance
                    ];
                    $totalAssets += $balance;
                }
            } elseif ($gl->glac_type == 2) { // Liability (Cr Nature)
                $balance = $cr - $dr;
                if ($balance != 0) {
                    $liabilities[] = [
                        'code' => $gl->glac_code,
                        'name' => $gl->glac_name,
                        'balance' => $balance
                    ];
                    $totalLiabilities += $balance;
                }
            } elseif ($gl->glac_type == 3) { // Income (Cr Nature)
                $totalIncome += ($cr - $dr);
            } elseif ($gl->glac_type == 4) { // Expense (Dr Nature)
                $totalExpense += ($dr - $cr);
            }
        }

        // Calculate Net Profit
        $netProfit = $totalIncome - $totalExpense;

        return response()->json([
            'assets' => $assets,
            'liabilities' => $liabilities,
            'net_profit' => $netProfit,
            'total_assets' => $totalAssets,
            'total_liabilities_and_equity' => $totalLiabilities + $netProfit,
            'date' => $date
        ]);
    }

    /**
     * Generate Cash Flow
     */
    public function cashFlow(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
        ]);

        $from = $request->date_from;
        $to = $request->date_to;
        $samityId = $request->samity_id;

        // 1. Identify Cash/Bank GL IDs
        // Try mappings first
        $mappedIds = \App\Models\GlMstMapping::whereIn('gl_code_type', ['CASH', 'BANK'])
            ->where('status', true)
            ->pluck('gl_mst_id')
            ->toArray();
        
        // Also fuzzy search for safety if mappings incomplete
        $fuzzyIds = GlAccount::where(function($q) {
                $q->where('glac_name', 'LIKE', '%Cash%')
                  ->orWhere('glac_name', 'LIKE', '%Bank%');
            })
            ->where('glac_type', 'A') // Asset
            ->pluck('id')
            ->toArray();

        $cashIds = array_unique(array_merge($mappedIds, $fuzzyIds));

        if (empty($cashIds)) {
             return response()->json([
                'opening_balance' => 0,
                'inflows' => [],
                'outflows' => [],
                'total_inflow' => 0,
                'total_outflow' => 0,
                'closing_balance' => 0,
                'message' => 'No Cash/Bank accounts found.'
            ]);
        }

        // 2. Calculate Opening Balance (Dr - Cr) before period
        $opQuery = Transaction::query()
            ->whereIn('glac_id', $cashIds)
            ->where('tran_date', '<', $from)
            ->where('status', 'posted');

        if ($samityId) {
            $opQuery->where('samity_id', $samityId);
        }

        $opResult = $opQuery->select(
            DB::raw('SUM(dr_amt) as total_dr'),
            DB::raw('SUM(cr_amt) as total_cr')
        )->first();

        $openingBalance = ($opResult->total_dr ?? 0) - ($opResult->total_cr ?? 0);

        // 3. Inflows (Receipts)
        // Find batches where Cash was Debited, sum the Credits of other accounts
        $inflowQuery = DB::table('transactions as t1') // t1 is Cash Dr
            ->join('transactions as t2', 't1.batch_num', '=', 't2.batch_num') // t2 is Source Cr
            ->join('glac_mst as g2', 't2.glac_id', '=', 'g2.id')
            ->whereIn('t1.glac_id', $cashIds)
            ->where('t1.dr_amt', '>', 0)
            ->where('t1.tran_date', '>=', $from)
            ->where('t1.tran_date', '<=', $to)
            ->where('t1.status', 'posted')
            ->where('t2.cr_amt', '>', 0) // We want the Credit side amounts
            ->whereNotIn('t2.glac_id', $cashIds); // Exclude internal transfers

        if ($samityId) {
            $inflowQuery->where('t1.samity_id', $samityId);
        }

        $inflows = $inflowQuery->select(
                't2.tran_type',
                'g2.glac_name as account_name',
                DB::raw('SUM(t2.cr_amt) as amount')
            )
            ->groupBy('t2.tran_type', 'g2.glac_name')
            ->orderBy('t2.tran_type')
            ->get();

        // 4. Outflows (Payments)
        // Find batches where Cash was Credited, sum the Debits of other accounts
        $outflowQuery = DB::table('transactions as t1') // t1 is Cash Cr
            ->join('transactions as t2', 't1.batch_num', '=', 't2.batch_num') // t2 is Destination Dr
            ->join('glac_mst as g2', 't2.glac_id', '=', 'g2.id')
            ->whereIn('t1.glac_id', $cashIds)
            ->where('t1.cr_amt', '>', 0)
            ->where('t1.tran_date', '>=', $from)
            ->where('t1.tran_date', '<=', $to)
            ->where('t1.status', 'posted')
            ->where('t2.dr_amt', '>', 0) // We want the Debit side amounts
            ->whereNotIn('t2.glac_id', $cashIds); // Exclude internal transfers

        if ($samityId) {
            $outflowQuery->where('t1.samity_id', $samityId);
        }

        $outflows = $outflowQuery->select(
                't2.tran_type',
                'g2.glac_name as account_name',
                DB::raw('SUM(t2.dr_amt) as amount')
            )
            ->groupBy('t2.tran_type', 'g2.glac_name')
            ->orderBy('t2.tran_type')
            ->get();

        $totalInflow = $inflows->sum('amount');
        $totalOutflow = $outflows->sum('amount');

        return response()->json([
            'opening_balance' => $openingBalance,
            'inflows' => $inflows,
            'outflows' => $outflows,
            'total_inflow' => $totalInflow,
            'total_outflow' => $totalOutflow,
            'closing_balance' => $openingBalance + $totalInflow - $totalOutflow,
            'date_from' => $from,
            'date_to' => $to
        ]);
    }

    /**
     * Generate Trial Balance
     */
    public function trialBalance(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
        ]);

        $date = $request->date;
        $samityId = $request->samity_id;

        $query = Transaction::query()
            ->select(
                'glac_id',
                DB::raw('SUM(dr_amt) as total_dr'),
                DB::raw('SUM(cr_amt) as total_cr')
            )
            ->where('tran_date', '<=', $date)
            ->where('status', 'posted');

        if ($samityId) {
            $query->where('samity_id', $samityId);
        }

        $balances = $query->groupBy('glac_id')->get()->keyBy('glac_id');

        // Fetch GL Details
        $glAccounts = GlAccount::where('parent_child', 'C') // Only leaf nodes
            ->orderBy('glac_code')
            ->get();

        $reportData = [];
        $totalDr = 0;
        $totalCr = 0;

        foreach ($glAccounts as $gl) {
            if (isset($balances[$gl->id])) {
                $dr = $balances[$gl->id]->total_dr ?? 0;
                $cr = $balances[$gl->id]->total_cr ?? 0;

                $netDr = 0;
                $netCr = 0;

                if ($dr > $cr) {
                    $netDr = $dr - $cr;
                } elseif ($cr > $dr) {
                    $netCr = $cr - $dr;
                }

                if ($netDr > 0 || $netCr > 0) {
                    $reportData[] = [
                        'gl_code' => $gl->glac_code,
                        'gl_name' => $gl->glac_name,
                        'debit' => $netDr,
                        'credit' => $netCr,
                    ];

                    $totalDr += $netDr;
                    $totalCr += $netCr;
                }
            }
        }

        return response()->json([
            'data' => $reportData,
            'total_debit' => $totalDr,
            'total_credit' => $totalCr,
            'date' => $date
        ]);
    }

    /**
     * Account Balance Report
     */
    public function accountBalance(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
        ]);

        $date = $request->date;
        $samityId = $request->samity_id;

        // Fetch Members
        $membersQuery = MemberInfo::with(['samity']);
        if ($samityId) {
            $membersQuery->where('samity_id', $samityId);
        }
        $members = $membersQuery->get();

        $reportData = [];

        foreach ($members as $member) {
            // Savings Accounts
            $savings = SavingsAccount::where('member_id', $member->id)->with('product')->get();
            foreach ($savings as $acc) {
                // Calculate balance as of date
                // Balance = Sum(Cr) - Sum(Dr)
                $tx = Transaction::where('customer_id', $acc->id) // Savings Account ID
                    ->where('tran_date', '<=', $date)
                    ->where('status', 'posted')
                    ->select(DB::raw('SUM(dr_amt) as dr'), DB::raw('SUM(cr_amt) as cr'))
                    ->first();
                
                $balance = ($tx->cr ?? 0) - ($tx->dr ?? 0);

                if ($balance != 0) {
                    $reportData[] = [
                        'samity_name' => $member->samity->samity_name,
                        'member_code' => $member->member_code,
                        'member_name' => $member->member_name,
                        'account_no' => $acc->account_number,
                        'product_name' => $acc->product->product_name,
                        'type' => 'Savings',
                        'balance' => $balance
                    ];
                }
            }

            // Loan Accounts
            $loans = LoanAccount::where('member_id', $member->id)->with(['loanApplication.product'])->get();
            foreach ($loans as $acc) {
                // For Loans, customer_id in transaction is MemberID, need to filter by ProductID
                // Balance = Sum(Dr) - Sum(Cr)
                $productId = $acc->loanApplication->product_id;
                
                $tx = Transaction::where('customer_id', $member->id)
                    ->where('product_id', $productId)
                    ->where('tran_date', '<=', $date)
                    ->where('status', 'posted')
                    ->select(DB::raw('SUM(dr_amt) as dr'), DB::raw('SUM(cr_amt) as cr'))
                    ->first();

                $balance = ($tx->dr ?? 0) - ($tx->cr ?? 0);

                if ($balance != 0) {
                     $reportData[] = [
                        'samity_name' => $member->samity->samity_name,
                        'member_code' => $member->member_code,
                        'member_name' => $member->member_name,
                        'account_no' => $acc->account_no,
                        'product_name' => $acc->loanApplication->product->product_name,
                        'type' => 'Loan',
                        'balance' => $balance
                    ];
                }
            }
        }

        return response()->json([
            'data' => $reportData,
            'date' => $date
        ]);
    }

    /**
     * Loan Report
     */
    public function loanReport(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
        ]);

        $query = LoanAccount::with(['member.samity', 'loanApplication.product']);

        if ($request->samity_id) {
            $query->whereHas('member', function($q) use ($request) {
                $q->where('samity_id', $request->samity_id);
            });
        }

        if ($request->date_from && $request->date_to) {
            $query->whereBetween('disbursed_date', [$request->date_from, $request->date_to]);
        }

        $loans = $query->get();

        $reportData = $loans->map(function($loan) {
            return [
                'samity_name' => $loan->member->samity->samity_name,
                'member_code' => $loan->member->member_code,
                'member_name' => $loan->member->member_name,
                'account_no' => $loan->account_no,
                'product_name' => $loan->loanApplication->product->product_name,
                'disbursed_date' => $loan->disbursed_date,
                'principal_amount' => $loan->principal_amount,
                'interest_amount' => $loan->interest_amount,
                'total_payable' => $loan->total_payable,
                'total_paid' => $loan->total_paid,
                'current_balance' => $loan->current_balance, // Outstanding
                'status' => $loan->status
            ];
        });

        return response()->json(['data' => $reportData]);
    }

    /**
     * Loan Due Report
     */
    public function loanDueReport(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
        ]);

        $date = $request->date;
        
        // Find schedules that are due/overdue
        // We need to join with LoanAccount and Member
        $schedules = DB::table('loan_repayment_schedules as s')
            ->join('loan_accounts as l', 's.loan_account_id', '=', 'l.id')
            ->join('member_infos as m', 'l.member_id', '=', 'm.id')
            ->join('samity_profiles as samity', 'm.samity_id', '=', 'samity.id')
            ->join('products as p', function($join) {
                // Need to link product via loan application. 
                // Since we don't have direct link in query easily without more joins, 
                // let's fetch product name via Eloquent or just additional join
                // LoanAccount -> LoanApplication -> Product
                // But LoanAccount has loan_application_id
            })
            ->join('loan_applications as la', 'l.loan_application_id', '=', 'la.id')
            ->join('products as prod', 'la.product_id', '=', 'prod.id')
            ->where('s.due_date', '<=', $date)
            ->where('s.status', '!=', 'paid') // Not fully paid
            ->where('l.status', 'active') // Only active loans
            ->select(
                'samity.samity_name',
                'm.member_code',
                'm.member_name as member_name',
                'l.account_no',
                'prod.product_name',
                's.due_date',
                's.installment_no',
                's.principal_amount',
                's.interest_amount',
                's.paid_principal',
                's.paid_interest'
            );

        if ($request->samity_id) {
            $schedules->where('m.samity_id', $request->samity_id);
        }

        $results = $schedules->get();

        // Process to calculate due amount
        $reportData = $results->map(function($s) {
            $totalAmount = $s->principal_amount + $s->interest_amount;
            $paidAmount = $s->paid_principal + $s->paid_interest;
            $dueAmount = $totalAmount - $paidAmount;

            if ($dueAmount > 0) {
                return [
                    'samity_name' => $s->samity_name,
                    'member_code' => $s->member_code,
                    'member_name' => $s->member_name,
                    'account_no' => $s->account_no,
                    'product_name' => $s->product_name,
                    'due_date' => $s->due_date,
                    'installment_no' => $s->installment_no,
                    'due_amount' => $dueAmount
                ];
            }
            return null;
        })->filter()->values();

        return response()->json(['data' => $reportData]);
    }

    /**
     * Transaction Report
     */
    public function transactionReport(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
        ]);

        $query = Transaction::query()
            ->with(['glAccount']) // Basic info
            ->whereBetween('tran_date', [$request->date_from, $request->date_to])
            ->where('status', 'posted')
            ->orderBy('tran_date')
            ->orderBy('id');

        if ($request->samity_id) {
            $query->where('samity_id', $request->samity_id);
        }

        $transactions = $query->get();

        return response()->json(['data' => $transactions]);
    }

    /**
     * Expense Report
     */
    public function expenseReport(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
        ]);

        // GL Type 4 = Expense
        $expenses = Transaction::whereHas('glAccount', function($q) {
                $q->where('glac_type', 4);
            })
            ->whereBetween('tran_date', [$request->date_from, $request->date_to])
            ->where('status', 'posted')
            ->select(
                'glac_id',
                DB::raw('SUM(dr_amt) - SUM(cr_amt) as amount') // Expense is Dr nature
            )
            ->groupBy('glac_id')
            ->with('glAccount')
            ->get();

        $reportData = $expenses->map(function($exp) {
            return [
                'gl_code' => $exp->glAccount->glac_code,
                'gl_name' => $exp->glAccount->glac_name,
                'amount' => $exp->amount
            ];
        })->filter(function($item) {
            return $item['amount'] != 0;
        })->values();

        return response()->json([
            'data' => $reportData,
            'total' => $reportData->sum('amount')
        ]);
    }

    /**
     * Revenue Report
     */
    public function revenueReport(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date',
        ]);

        // GL Type 3 = Income
        $incomes = Transaction::whereHas('glAccount', function($q) {
                $q->where('glac_type', 3);
            })
            ->whereBetween('tran_date', [$request->date_from, $request->date_to])
            ->where('status', 'posted')
            ->select(
                'glac_id',
                DB::raw('SUM(cr_amt) - SUM(dr_amt) as amount') // Income is Cr nature
            )
            ->groupBy('glac_id')
            ->with('glAccount')
            ->get();

        $reportData = $incomes->map(function($inc) {
            return [
                'gl_code' => $inc->glAccount->glac_code,
                'gl_name' => $inc->glAccount->glac_name,
                'amount' => $inc->amount
            ];
        })->filter(function($item) {
            return $item['amount'] != 0;
        })->values();

        return response()->json([
            'data' => $reportData,
            'total' => $reportData->sum('amount')
        ]);
    }
}
