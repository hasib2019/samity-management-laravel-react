<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GlAccount;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
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

        // Transaction Types classification
        $inflowTypes = ['Deposit', 'LoanRepayment', 'Received'];
        $outflowTypes = ['Withdraw', 'LoanDisbursement', 'Payment'];

        // 1. Calculate Opening Balance (Before Date From)
        $opQuery = Transaction::query()->where('tran_date', '<', $from)->where('status', 'posted');
        if ($samityId) {
            $opQuery->where('samity_id', $samityId);
        }
        
        $opInflow = (clone $opQuery)->whereIn('tran_type', $inflowTypes)->sum('dr_amt');
        $opOutflow = (clone $opQuery)->whereIn('tran_type', $outflowTypes)->sum('dr_amt');
        
        $openingBalance = $opInflow - $opOutflow;

        // 2. Calculate Period Flows
        $periodQuery = Transaction::query()
            ->select('tran_type', DB::raw('SUM(dr_amt) as total_amount'))
            ->whereBetween('tran_date', [$from, $to])
            ->where('status', 'posted');

        if ($samityId) {
            $periodQuery->where('samity_id', $samityId);
        }

        $flows = $periodQuery->groupBy('tran_type')->get();

        $inflows = [];
        $outflows = [];
        $totalInflow = 0;
        $totalOutflow = 0;

        foreach ($flows as $flow) {
            $amount = $flow->total_amount;
            if (in_array($flow->tran_type, $inflowTypes)) {
                $label = $flow->tran_type;
                if ($label == 'LoanRepayment') $label = 'Loan Collection';
                if ($label == 'Received') $label = 'General Receipts';
                if ($label == 'Deposit') $label = 'Savings Deposit';
                
                $inflows[] = ['name' => $label, 'amount' => $amount];
                $totalInflow += $amount;
            } elseif (in_array($flow->tran_type, $outflowTypes)) {
                $label = $flow->tran_type;
                if ($label == 'LoanDisbursement') $label = 'Loan Disbursement';
                if ($label == 'Payment') $label = 'Expenses & Payments';
                if ($label == 'Withdraw') $label = 'Savings Withdraw';

                $outflows[] = ['name' => $label, 'amount' => $amount];
                $totalOutflow += $amount;
            }
        }

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
}
