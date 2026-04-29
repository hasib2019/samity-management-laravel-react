<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GlAccount;
use App\Models\Transaction;
use App\Models\SavingsAccount;
use App\Models\LoanAccount;
use App\Models\MemberInfo;
use App\Models\DepositRequest;
use App\Models\WithdrawRequest;
use App\Models\ShareAccount;
use App\Models\DpsApplication;
use App\Models\FdrApplication;
use App\Models\MemberLoanAccount;
use App\Models\LoanRepaymentSchedule;
use App\Models\Product;
use Carbon\Carbon;
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
            $statementRows = $this->buildSavingsStatementRows($accountId);

            $openingBalance = collect($statementRows)
                ->filter(fn ($row) => $row['tran_date'] < $from)
                ->sum(fn ($row) => $row['deposit_amount'] - $row['withdraw_amount']);

            $transactions = collect($statementRows)
                ->filter(fn ($row) => $row['tran_date'] >= $from && $row['tran_date'] <= $to)
                ->values();

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

    private function buildSavingsStatementRows(int $accountId): array
    {
        $depositRows = DepositRequest::with('transaction')
            ->where('savings_account_id', $accountId)
            ->where('status', 'approved')
            ->get()
            ->map(function ($deposit) {
                $tranDate = $deposit->transaction?->tran_date
                    ?? optional($deposit->updated_at)->toDateString()
                    ?? optional($deposit->created_at)->toDateString();

                return [
                    'tran_date' => $tranDate,
                    'reference' => $deposit->transaction?->batch_num ?: ($deposit->transaction?->tran_num ?: 'DEP-' . $deposit->id),
                    'particulars' => $deposit->description ?: ($deposit->transaction?->naration ?: 'Deposit'),
                    'deposit_amount' => (float) $deposit->amount,
                    'withdraw_amount' => 0,
                    'sort_order' => $deposit->transaction?->id ?? $deposit->id,
                ];
            });

        $withdrawRows = WithdrawRequest::with('transaction')
            ->where('savings_account_id', $accountId)
            ->where('status', 'approved')
            ->get()
            ->map(function ($withdraw) {
                $tranDate = $withdraw->transaction?->tran_date
                    ?? optional($withdraw->updated_at)->toDateString()
                    ?? optional($withdraw->created_at)->toDateString();

                return [
                    'tran_date' => $tranDate,
                    'reference' => $withdraw->transaction?->batch_num ?: ($withdraw->transaction?->tran_num ?: 'WIT-' . $withdraw->id),
                    'particulars' => $withdraw->description ?: ($withdraw->transaction?->naration ?: 'Withdraw'),
                    'deposit_amount' => 0,
                    'withdraw_amount' => (float) $withdraw->amount,
                    'sort_order' => $withdraw->transaction?->id ?? $withdraw->id,
                ];
            });

        return $depositRows
            ->concat($withdrawRows)
            ->sortBy([
                ['tran_date', 'asc'],
                ['sort_order', 'asc'],
            ])
            ->values()
            ->map(function ($row) {
                unset($row['sort_order']);
                return $row;
            })
            ->all();
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
            'samity_id' => 'nullable|exists:samity_profiles,id',
            'account_type' => 'nullable|in:all,savings,share,dps,fdr,loan,member_loan',
        ]);

        $samityId = $request->samity_id;
        $accountType = $request->input('account_type', 'all');
        $reportData = collect();

        $matchesType = fn (string $type) => $accountType === 'all' || $accountType === $type;
        $memberScope = function ($query) use ($samityId) {
            if ($samityId) {
                $query->where('samity_id', $samityId);
            }
        };

        if ($matchesType('savings')) {
            $reportData = $reportData->concat(
                SavingsAccount::with(['member.samity', 'product'])
                    ->whereHas('member', $memberScope)
                    ->get()
                    ->map(function ($account) {
                        return [
                            'samity_name' => $account->member?->samity?->samity_name,
                            'member_code' => $account->member?->member_code,
                            'member_name' => $account->member?->member_name,
                            'account_no' => $account->account_number,
                            'product_name' => $account->product?->product_name,
                            'type' => 'Savings',
                            'status' => $account->status,
                            'balance' => (float) $account->current_balance,
                        ];
                    })
            );
        }

        if ($matchesType('share')) {
            $reportData = $reportData->concat(
                ShareAccount::with(['member.samity', 'product'])
                    ->whereHas('member', $memberScope)
                    ->get()
                    ->map(function ($account) {
                        return [
                            'samity_name' => $account->member?->samity?->samity_name,
                            'member_code' => $account->member?->member_code,
                            'member_name' => $account->member?->member_name,
                            'account_no' => $account->account_no,
                            'product_name' => $account->product?->product_name,
                            'type' => 'Share',
                            'status' => $account->status,
                            'balance' => (float) $account->current_balance,
                        ];
                    })
            );
        }

        if ($matchesType('dps')) {
            $reportData = $reportData->concat(
                DpsApplication::with(['member.samity', 'product'])
                    ->whereHas('member', $memberScope)
                    ->get()
                    ->map(function ($account) {
                        return [
                            'samity_name' => $account->member?->samity?->samity_name,
                            'member_code' => $account->member?->member_code,
                            'member_name' => $account->member?->member_name,
                            'account_no' => $account->account_no,
                            'product_name' => $account->product?->product_name,
                            'type' => 'DPS',
                            'status' => $account->status,
                            'balance' => (float) $account->balance,
                        ];
                    })
            );
        }

        if ($matchesType('fdr')) {
            $reportData = $reportData->concat(
                FdrApplication::with(['member.samity', 'product'])
                    ->whereHas('member', $memberScope)
                    ->get()
                    ->map(function ($account) {
                        return [
                            'samity_name' => $account->member?->samity?->samity_name,
                            'member_code' => $account->member?->member_code,
                            'member_name' => $account->member?->member_name,
                            'account_no' => $account->account_no,
                            'product_name' => $account->product?->product_name,
                            'type' => 'FDR',
                            'status' => $account->status,
                            'balance' => (float) ($account->maturity_amount ?? $account->fdr_amount ?? 0),
                        ];
                    })
            );
        }

        if ($matchesType('loan')) {
            $reportData = $reportData->concat(
                LoanAccount::with(['member.samity', 'loanApplication.product'])
                    ->whereHas('member', $memberScope)
                    ->get()
                    ->map(function ($account) {
                        return [
                            'samity_name' => $account->member?->samity?->samity_name,
                            'member_code' => $account->member?->member_code,
                            'member_name' => $account->member?->member_name,
                            'account_no' => $account->account_no,
                            'product_name' => $account->loanApplication?->product?->product_name,
                            'type' => 'Loan',
                            'status' => $account->status,
                            'balance' => (float) $account->current_balance,
                        ];
                    })
            );
        }

        if ($matchesType('member_loan')) {
            $reportData = $reportData->concat(
                MemberLoanAccount::with(['member.samity', 'product'])
                    ->whereHas('member', $memberScope)
                    ->get()
                    ->map(function ($account) {
                        return [
                            'samity_name' => $account->member?->samity?->samity_name,
                            'member_code' => $account->member?->member_code,
                            'member_name' => $account->member?->member_name,
                            'account_no' => $account->account_no,
                            'product_name' => $account->product?->product_name,
                            'type' => 'Member Loan',
                            'status' => $account->status,
                            'balance' => (float) $account->total_outstanding,
                        ];
                    })
            );
        }

        $reportData = $reportData
            ->filter(fn ($item) => abs((float) $item['balance']) > 0.009)
            ->sortBy([
                ['samity_name', 'asc'],
                ['member_name', 'asc'],
                ['type', 'asc'],
                ['account_no', 'asc'],
            ])
            ->values();

        return response()->json([
            'data' => $reportData,
            'total_balance' => round((float) $reportData->sum('balance'), 2),
            'total_accounts' => $reportData->count(),
            'account_type' => $accountType,
        ]);
    }

    /**
     * Loan Report
     */
    public function loanProducts(Request $request)
    {
        $request->validate([
            'loan_type' => 'nullable|in:loan,member_loan',
        ]);

        $loanType = $request->input('loan_type', 'loan');

        return response()->json(
            Product::query()
                ->where('product_type', $loanType)
                ->where('status', 'active')
                ->orderBy('product_name')
                ->get(['id', 'product_name', 'product_type'])
        );
    }

    public function loanReport(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
            'loan_type' => 'nullable|in:loan,member_loan',
            'product_id' => 'nullable|exists:product_mst,id',
        ]);

        $loanType = $request->input('loan_type', 'loan');

        if ($loanType === 'member_loan') {
            $query = MemberLoanAccount::with(['member.samity', 'product']);

            if ($request->samity_id) {
                $query->where('samity_id', $request->samity_id);
            }

            if ($request->product_id) {
                $query->where('product_id', $request->product_id);
            }

            if ($request->date_from && $request->date_to) {
                $query->whereBetween('disbursed_date', [$request->date_from, $request->date_to]);
            }

            $loans = $query->get();

            $reportData = $loans->map(function ($loan) {
                return [
                    'samity_name' => $loan->member?->samity?->samity_name,
                    'member_code' => $loan->member?->member_code,
                    'member_name' => $loan->member?->member_name,
                    'account_no' => $loan->account_no,
                    'product_name' => $loan->product?->product_name,
                    'loan_type' => 'member_loan',
                    'disbursed_date' => $loan->disbursed_date,
                    'principal_amount' => (float) $loan->original_principal,
                    'interest_amount' => (float) $loan->total_interest_accrued,
                    'total_payable' => (float) ((float) $loan->original_principal + (float) $loan->total_interest_accrued),
                    'total_paid' => (float) $loan->total_paid_amount,
                    'current_balance' => (float) $loan->total_outstanding,
                    'status' => $loan->status,
                ];
            })->values();
        } else {
            $query = LoanAccount::with(['member.samity', 'loanApplication.product']);

            if ($request->samity_id) {
                $query->whereHas('member', function ($q) use ($request) {
                    $q->where('samity_id', $request->samity_id);
                });
            }

            if ($request->product_id) {
                $query->whereHas('loanApplication', function ($q) use ($request) {
                    $q->where('product_id', $request->product_id);
                });
            }

            if ($request->date_from && $request->date_to) {
                $query->whereBetween('disbursed_date', [$request->date_from, $request->date_to]);
            }

            $loans = $query->get();

            $reportData = $loans->map(function ($loan) {
                return [
                    'samity_name' => $loan->member?->samity?->samity_name,
                    'member_code' => $loan->member?->member_code,
                    'member_name' => $loan->member?->member_name,
                    'account_no' => $loan->account_no,
                    'product_name' => $loan->loanApplication?->product?->product_name,
                    'loan_type' => 'loan',
                    'disbursed_date' => $loan->disbursed_date,
                    'principal_amount' => (float) $loan->principal_amount,
                    'interest_amount' => (float) $loan->interest_amount,
                    'total_payable' => (float) $loan->total_payable,
                    'total_paid' => (float) $loan->total_paid,
                    'current_balance' => (float) $loan->current_balance,
                    'status' => $loan->status,
                ];
            })->values();
        }

        return response()->json([
            'data' => $reportData,
            'total_disbursed' => round((float) $reportData->sum('principal_amount'), 2),
            'total_paid' => round((float) $reportData->sum('total_paid'), 2),
            'total_outstanding' => round((float) $reportData->sum('current_balance'), 2),
        ]);
    }

    /**
     * Loan Due Report
     */
    public function loanDueReport(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'samity_id' => 'nullable|exists:samity_profiles,id',
            'loan_type' => 'nullable|in:loan,member_loan',
            'product_id' => 'nullable|exists:product_mst,id',
        ]);

        $date = $request->date;
        $loanType = $request->input('loan_type', 'loan');

        if ($loanType === 'member_loan') {
            $query = MemberLoanAccount::with(['member.samity', 'product'])
                ->where('status', '!=', 'closed');

            if ($request->samity_id) {
                $query->where('samity_id', $request->samity_id);
            }

            if ($request->product_id) {
                $query->where('product_id', $request->product_id);
            }

            $reportData = $query->get()
                ->map(function ($account) use ($date) {
                    $preview = $this->previewMemberLoanDue($account, $date);

                    if (($preview['due_amount'] ?? 0) <= 0.009) {
                        return null;
                    }

                    if (!$preview['is_due']) {
                        return null;
                    }

                    return [
                        'samity_name' => $account->member?->samity?->samity_name,
                        'member_code' => $account->member?->member_code,
                        'member_name' => $account->member?->member_name,
                        'account_no' => $account->account_no,
                        'product_name' => $account->product?->product_name,
                        'loan_type' => 'member_loan',
                        'due_date' => $preview['due_date'],
                        'installment_no' => '-',
                        'due_amount' => $preview['due_amount'],
                    ];
                })
                ->filter()
                ->values();
        } else {
            $accountNos = LoanAccount::query()
                ->pluck('account_no', 'loan_application_id');

            $query = LoanRepaymentSchedule::with(['loanApplication.member.samity', 'loanApplication.product'])
                ->whereDate('due_date', '<=', $date)
                ->where('status', '!=', 'paid');

            if ($request->samity_id) {
                $query->whereHas('loanApplication.member', function ($q) use ($request) {
                    $q->where('samity_id', $request->samity_id);
                });
            }

            if ($request->product_id) {
                $query->whereHas('loanApplication', function ($q) use ($request) {
                    $q->where('product_id', $request->product_id);
                });
            }

            $reportData = $query->get()
                ->map(function ($schedule) use ($accountNos) {
                    $dueAmount = round(
                        ((float) $schedule->principal_amount + (float) $schedule->interest_amount + (float) $schedule->fine_amount)
                        - ((float) $schedule->paid_principal + (float) $schedule->paid_interest + (float) $schedule->paid_fine),
                        2
                    );

                    if ($dueAmount <= 0.009) {
                        return null;
                    }

                    return [
                        'samity_name' => $schedule->loanApplication?->member?->samity?->samity_name,
                        'member_code' => $schedule->loanApplication?->member?->member_code,
                        'member_name' => $schedule->loanApplication?->member?->member_name,
                        'account_no' => $accountNos[$schedule->loan_application_id] ?? '-',
                        'product_name' => $schedule->loanApplication?->product?->product_name,
                        'loan_type' => 'loan',
                        'due_date' => $schedule->due_date,
                        'installment_no' => $schedule->installment_no,
                        'due_amount' => $dueAmount,
                    ];
                })
                ->filter()
                ->values();
        }

        return response()->json([
            'data' => $reportData,
            'total_due' => round((float) $reportData->sum('due_amount'), 2),
            'loan_type' => $loanType,
        ]);
    }

    private function previewMemberLoanDue(MemberLoanAccount $account, string $asOfDate): array
    {
        $principal = round((float) $account->outstanding_principal, 2);
        $accruedInterest = round((float) $account->accrued_interest_balance, 2);
        $overdueInterest = round((float) $account->overdue_interest_balance, 2);
        $nextAccrualDate = $account->next_accrual_date ? Carbon::parse($account->next_accrual_date)->startOfDay() : null;
        $asOf = Carbon::parse($asOfDate)->startOfDay();

        while ($nextAccrualDate && $nextAccrualDate->lessThanOrEqualTo($asOf) && $principal > 0.009) {
            $interestAmount = round($principal * ((float) $account->monthly_interest_rate / 100), 2);
            $accruedInterest = round($accruedInterest + $interestAmount, 2);
            $nextAccrualDate = $nextAccrualDate->copy()->addDays(30);
        }

        $dueDate = $account->next_accrual_date ?: $account->disbursed_date;
        $isDue = $account->next_accrual_date
            ? Carbon::parse($account->next_accrual_date)->startOfDay()->lessThanOrEqualTo($asOf)
            : true;

        return [
            'due_amount' => round($principal + $accruedInterest + $overdueInterest, 2),
            'due_date' => $dueDate,
            'is_due' => $isDue,
        ];
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
