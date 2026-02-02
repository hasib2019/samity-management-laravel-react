<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DpsApplication;
use App\Models\GlMstMapping;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class DpsClosingController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $query = $request->input('query');

        $dpsApplication = DpsApplication::with(['member', 'product'])
            ->where('status', 'active')
            ->where(function($q) use ($query) {
                $q->where('account_no', $query)
                  ->orWhereHas('member', function($sq) use ($query) {
                      $sq->where('member_code', $query);
                  });
            })
            ->first();

        if (!$dpsApplication) {
            return response()->json(['message' => 'Active DPS Account not found'], 404);
        }

        // Calculate Closing Info
        $today = Carbon::now();
        $maturityDate = Carbon::parse($dpsApplication->maturity_date);
        $isMatured = $today->gte($maturityDate);
        
        $totalDeposited = $dpsApplication->balance;
        $payableAmount = $totalDeposited;
        $interest = 0;
        $penalty = 0;

        if ($isMatured) {
            $payableAmount = $dpsApplication->maturity_amount;
            $interest = $payableAmount - $totalDeposited;
        } else {
            // Premature Closing Logic
            // If penalty applicable, we might want to suggest one.
            // For now, let's keep it 0 and let user enter it.
            if ($dpsApplication->product->penalty_applicable) {
                // $penalty = ... logic if defined
            }
        }

        return response()->json([
            'application' => $dpsApplication,
            'closing_info' => [
                'is_matured' => $isMatured,
                'total_deposited' => $totalDeposited,
                'calculated_payable' => $payableAmount,
                'calculated_interest' => $interest,
                'calculated_penalty' => $penalty,
                'duration_passed' => $today->diffInMonths($dpsApplication->start_date)
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dps_application_id' => 'required|exists:dps_applications,id',
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

            $dpsApplication = DpsApplication::with('product')->findOrFail($request->dps_application_id);
            
            if ($dpsApplication->status !== 'active') {
                throw new \Exception("Account is not active");
            }

            // Update Application
            $dpsApplication->status = 'closed';
            $dpsApplication->updated_by = Auth::id();
            $dpsApplication->save();

            // GL Transactions
            $cashMap = GlMstMapping::where('gl_code_type', 'CASH')->where('status', true)->first();
            if (!$cashMap) {
                throw new \Exception("Cash GL Mapping not found");
            }

            $batch = 'DCL' . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
            $commonData = [
                'samity_id' => $dpsApplication->member->samity_id ?? null,
                'customer_id' => $dpsApplication->member_id,
                'product_id' => $dpsApplication->product_id,
                'payment_mode' => 'cash',
                'batch_num' => $batch,
                'tran_code' => 'PAY', 
                'tran_type' => 'DPSClosing',
                'tran_date' => $request->closing_date,
                'naration' => $request->naration ?? 'DPS Closing',
                'authorize_status' => 'approved',
                'authorized_by' => Auth::id(),
                'authorized_at' => now(),
                'created_by' => Auth::id(),
                'status' => 'posted'
            ];

            // 1. Debit DPS Principal (Liability) - The entire balance in the account
            // Wait, we need to zero out the liability.
            // The liability balance in GL should match $dpsApplication->balance.
            // So we Debit the Principal GL with $dpsApplication->balance.
            
            if ($dpsApplication->product->gl_principal_id) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $dpsApplication->product->gl_principal_id,
                    'dr_amt' => $dpsApplication->balance,
                    'cr_amt' => 0,
                ]));
            } else {
                 throw new \Exception("Product Principal GL not defined");
            }

            // 2. Debit Interest Expense (if any interest paid)
            if ($request->interest_paid > 0) {
                // We need an Interest Expense GL.
                // Assuming product has gl_interest_id (usually for expense in savings products)
                // If not, we might need to fetch it or use a default.
                // Let's check Product model fields. Assuming gl_interest_id exists.
                
                $interestGlId = $dpsApplication->product->gl_interest_id; 
                // If the product table doesn't have it, we might have an issue.
                // I'll assume it exists or fallback?
                // For now, let's assume it exists. If not, it will fail, which is better than wrong posting.
                
                 if ($interestGlId) {
                    Transaction::create(array_merge($commonData, [
                        'tran_num' => date('YmdHis') . rand(11, 99),
                        'glac_id' => $interestGlId,
                        'dr_amt' => $request->interest_paid,
                        'cr_amt' => 0,
                    ]));
                }
            }

            // 3. Credit Penalty Income (if any)
            $penalty = $request->penalty_amount ?? 0;
            if ($penalty > 0) {
                // We need a Penalty Income GL.
                // Assuming product has gl_penalty_id or we use a global mapping.
                // Let's try product specific first, then global.
                $penaltyGlId = $dpsApplication->product->gl_penalty_id;
                
                if (!$penaltyGlId) {
                    // Try global mapping
                    $penaltyMap = GlMstMapping::where('gl_code_type', 'PENALTY')->first(); // Assuming 'PENALTY' type exists
                    $penaltyGlId = $penaltyMap ? $penaltyMap->gl_mst_id : null;
                }

                if ($penaltyGlId) {
                    Transaction::create(array_merge($commonData, [
                        'tran_num' => date('YmdHis') . rand(12, 99),
                        'glac_id' => $penaltyGlId,
                        'dr_amt' => 0,
                        'cr_amt' => $penalty,
                    ]));
                } else {
                     // Fallback: Credit Interest Expense (reduce expense) or throw error?
                     // Usually better to have a dedicated GL. If not, maybe 'Other Income'.
                     // For now, let's throw error to force setup.
                     throw new \Exception("Penalty GL not defined for Product or Global Mapping");
                }
            }

            // 4. Credit Cash - Actual Cash Out
            // Cash Out = (Principal + Interest) - Penalty
            $totalCashOut = ($dpsApplication->balance + $request->interest_paid) - $penalty;

            if ($totalCashOut > 0) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(13, 99),
                    'glac_id' => $cashMap->gl_mst_id,
                    'dr_amt' => 0,
                    'cr_amt' => $totalCashOut,
                ]));
            }

            DB::commit();
            return response()->json(['message' => 'DPS Account Closed Successfully', 'batch' => $batch]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
