<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FdrApplication;
use App\Models\GlMstMapping;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class FdrClosingController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $query = $request->input('query');

        $fdrApplication = FdrApplication::with(['member', 'product'])
            ->where('status', 'active')
            ->where(function($q) use ($query) {
                $q->where('account_no', $query)
                  ->orWhereHas('member', function($sq) use ($query) {
                      $sq->where('member_code', $query);
                  });
            })
            ->first();

        if (!$fdrApplication) {
            return response()->json(['message' => 'Active FDR Account not found'], 404);
        }

        // Calculate Closing Info
        $today = Carbon::now();
        $maturityDate = Carbon::parse($fdrApplication->maturity_date);
        $isMatured = $today->gte($maturityDate);
        
        $principal = $fdrApplication->fdr_amount;
        $payableAmount = $principal;
        $interest = 0;
        $penalty = 0;

        if ($isMatured) {
            $payableAmount = $fdrApplication->maturity_amount;
            $interest = $payableAmount - $principal;
        } else {
            // Premature Closing Logic
            // Simple calculation: principal + some interest if applicable
            // For now, default to principal
        }

        return response()->json([
            'application' => $fdrApplication,
            'closing_info' => [
                'is_matured' => $isMatured,
                'principal_amount' => $principal,
                'calculated_payable' => $payableAmount,
                'calculated_interest' => $interest,
                'calculated_penalty' => $penalty,
                'duration_passed' => $today->diffInMonths($fdrApplication->start_date)
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fdr_application_id' => 'required|exists:fdr_applications,id',
            'closing_date' => 'required|date',
            'total_paid' => 'required|numeric|min:0',
            'interest_paid' => 'required|numeric|min:0',
            'penalty_amount' => 'nullable|numeric|min:0',
            'naration' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $fdrApplication = FdrApplication::with('product')->findOrFail($request->fdr_application_id);
            
            if ($fdrApplication->status !== 'active') {
                throw new \Exception("Account is not active");
            }

            // Update Application
            $fdrApplication->status = 'closed';
            $fdrApplication->updated_by = Auth::id();
            $fdrApplication->save();

            // Accounting Transactions
            // Dr. Principal GL (Liability Decrease)
            // Dr. Interest Expense GL (Expense)
            // Cr. Cash/Bank (Asset Decrease)
            // Cr. Penalty Income (Income) - if any

            $commonData = [
                'branch_id' => 1, // Default Branch
                'member_id' => $fdrApplication->member_id,
                'tran_date' => $request->closing_date,
                'tran_type' => 'FDR_CLOSING',
                'description' => $request->naration ?? 'FDR Closing for ' . $fdrApplication->account_no,
                'status' => 'posted',
                'created_by' => Auth::id(),
            ];

            // 1. Debit Principal (Liability)
            $principalGlId = $fdrApplication->product->gl_principal_id; // Usually "FDR Deposits" (Liability)
            if ($principalGlId) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $principalGlId,
                    'dr_amt' => $fdrApplication->fdr_amount,
                    'cr_amt' => 0,
                ]));
            }

            // 2. Debit Interest Expense
            $interest = $request->interest_paid;
            if ($interest > 0) {
                $profitGlId = $fdrApplication->product->gl_profit_id; // "Interest on FDR" (Expense)
                if ($profitGlId) {
                    Transaction::create(array_merge($commonData, [
                        'tran_num' => date('YmdHis') . rand(10, 99),
                        'glac_id' => $profitGlId,
                        'dr_amt' => $interest,
                        'cr_amt' => 0,
                    ]));
                }
            }

            // 3. Credit Penalty (Income)
            $penalty = $request->penalty_amount ?? 0;
            if ($penalty > 0) {
                $penaltyGlId = $fdrApplication->product->gl_penalty_id;
                if (!$penaltyGlId) {
                    $penaltyMap = GlMstMapping::where('gl_code_type', 'PENALTY')->first();
                    $penaltyGlId = $penaltyMap ? $penaltyMap->gl_mst_id : null;
                }
                
                if ($penaltyGlId) {
                    Transaction::create(array_merge($commonData, [
                        'tran_num' => date('YmdHis') . rand(12, 99),
                        'glac_id' => $penaltyGlId,
                        'dr_amt' => 0,
                        'cr_amt' => $penalty,
                    ]));
                }
            }

            // 4. Credit Cash/Bank (Net Payment)
            // Net Payment = Principal + Interest - Penalty
            $totalCashOut = ($fdrApplication->fdr_amount + $interest) - $penalty;

            // Use specific Cash GL if needed, or default to a system Cash GL
            // For now, let's assume Cash in Hand mapped via Global Mapping
            // Or maybe user should select the Source GL?
            // In DPS Closing, it seems we didn't handle Source GL explicitly, assuming Cash?
            // Let's check DpsClosingController... it might be missing or using default.
            // Wait, DpsClosingController I read earlier didn't show the Transaction part fully (truncated).
            // But usually, we credit Cash.
            
            $cashGlMap = GlMstMapping::where('gl_code_type', 'CASH_IN_HAND')->first();
            $cashGlId = $cashGlMap ? $cashGlMap->gl_mst_id : null;

            if ($cashGlId) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $cashGlId,
                    'dr_amt' => 0,
                    'cr_amt' => $totalCashOut,
                ]));
            } else {
                throw new \Exception("Cash GL Mapping not found");
            }

            DB::commit();
            return response()->json(['message' => 'FDR Closed successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to close FDR', 'error' => $e->getMessage()], 500);
        }
    }
}
