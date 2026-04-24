<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FdrApplication;
use App\Models\FdrClosing;
use App\Models\FdrCollection;
use App\Models\GlMstMapping;
use App\Models\Transaction;
use App\Helpers\FdrCalculationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class FdrClosingController extends Controller
{
    
    /**
     * Get all FDR closings
     */
    public function index(Request $request)
    {
        $query = FdrClosing::with(['fdrApplication.member', 'fdrApplication.product']);

        if ($request->fdr_application_id) {
            $query->where('fdr_application_id', $request->fdr_application_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $closings = $query->latest()->paginate(20);
        return response()->json($closings);
    }

    /**
     * Search for active FDR accounts to close
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $query = $request->input('query');

        $fdrApplication = FdrApplication::with(['member', 'product', 'collections'])
            ->where('status', 'active')
            ->where(function($q) use ($query) {
                $q->where('account_no', 'like', "%$query%")
                  ->orWhereHas('member', function($sq) use ($query) {
                      $sq->where('member_code', 'like', "%$query%");
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
        $interest = 0;

        // Calculate total interest collected so far
        $collectedInterest = FdrCollection::where('fdr_application_id', $fdrApplication->id)
            ->where('status', 'collected')
            ->sum('interest_amount');

        if ($isMatured) {
            // Calculate total interest for full tenure
            $interest = FdrCalculationHelper::calculateTotalInterest(
                $principal,
                $fdrApplication->interest_rate,
                $fdrApplication->duration
            );
        } else {
            // For premature closing, calculate interest accrued till now
            $interest = FdrCalculationHelper::calculateAccruedInterest(
                $principal,
                $fdrApplication->interest_rate,
                Carbon::parse($fdrApplication->start_date),
                $today
            );
        }

        $payableAmount = $principal + $interest;
        $totalInterestDue = $interest - $collectedInterest;

        return response()->json([
            'application' => $fdrApplication,
            'closing_info' => [
                'is_matured' => $isMatured,
                'principal_amount' => $principal,
                'total_interest_accrued' => $interest,
                'interest_collected' => $collectedInterest,
                'interest_due' => $totalInterestDue,
                'total_payable' => $payableAmount,
                'months_passed' => $today->diffInMonths($fdrApplication->start_date),
                'maturity_date' => $fdrApplication->maturity_date,
            ]
        ]);
    }

    /**
     * Record FDR Closing
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fdr_application_id' => 'required|exists:fdr_applications,id',
            'closing_date' => 'required|date',
            'principal_amount' => 'required|numeric|min:0',
            'total_interest_paid' => 'required|numeric|min:0',
            'penalty_amount' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $fdrApplication = FdrApplication::with('product')->findOrFail($request->fdr_application_id);
            
            if ($fdrApplication->status !== 'active') {
                throw new \Exception("FDR Account is not active");
            }

            // Create FDR Closing Record
            $totalPaid = $request->principal_amount + $request->total_interest_paid - ($request->penalty_amount ?? 0);
            
            $closing = FdrClosing::create([
                'fdr_application_id' => $fdrApplication->id,
                'closing_date' => $request->closing_date,
                'principal_amount' => $request->principal_amount,
                'total_interest_paid' => $request->total_interest_paid,
                'penalty_amount' => $request->penalty_amount ?? 0,
                'total_paid' => $totalPaid,
                'status' => 'completed',
                'remarks' => $request->remarks,
                'created_by' => Auth::id(),
            ]);

            // Update FDR Application Status
            $fdrApplication->status = 'closed';
            $fdrApplication->updated_by = Auth::id();
            $fdrApplication->save();

            // Create Accounting Transactions
            $this->createClosingTransactions($fdrApplication, $request, $closing);

            // Cancel any pending collections
            FdrCollection::where('fdr_application_id', $fdrApplication->id)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            DB::commit();

            return response()->json([
                'message' => 'FDR Account closed successfully',
                'data' => $closing->load('fdrApplication')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to close FDR Account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a closing record
     */
    public function show($id)
    {
        $closing = FdrClosing::with(['fdrApplication.member', 'fdrApplication.product'])->find($id);

        if (!$closing) {
            return response()->json(['message' => 'Closing record not found'], 404);
        }

        return response()->json($closing);
    }

    /**
     * Update a closing record (only if not completed)
     */
    public function update(Request $request, $id)
    {
        $closing = FdrClosing::find($id);

        if (!$closing) {
            return response()->json(['message' => 'Closing record not found'], 404);
        }

        if ($closing->status === 'completed') {
            return response()->json(['message' => 'Cannot update completed closing records'], 400);
        }

        $validator = Validator::make($request->all(), [
            'principal_amount' => 'required|numeric|min:0',
            'total_interest_paid' => 'required|numeric|min:0',
            'penalty_amount' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $totalPaid = $request->principal_amount + $request->total_interest_paid - ($request->penalty_amount ?? 0);

            $closing->update([
                'principal_amount' => $request->principal_amount,
                'total_interest_paid' => $request->total_interest_paid,
                'penalty_amount' => $request->penalty_amount ?? 0,
                'total_paid' => $totalPaid,
                'remarks' => $request->remarks,
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Closing record updated successfully',
                'data' => $closing
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update closing record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete/Cancel a closing record
     */
    public function destroy($id)
    {
        $closing = FdrClosing::find($id);

        if (!$closing) {
            return response()->json(['message' => 'Closing record not found'], 404);
        }

        try {
            DB::beginTransaction();

            // Revert FDR status to active
            $fdrApplication = $closing->fdrApplication;
            $fdrApplication->status = 'active';
            $fdrApplication->updated_by = Auth::id();
            $fdrApplication->save();

            // Delete transactions related to this closing
            Transaction::where('tran_type', 'FDR_CLOSING')
                ->where('naration', 'like', '%' . $fdrApplication->account_no . '%')
                ->where('tran_date', $closing->closing_date)
                ->delete();

            $closing->delete();

            DB::commit();

            return response()->json(['message' => 'Closing record deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete closing record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create GL accounting transactions for FDR Closing
     */
    private function createClosingTransactions($fdrApplication, $request, $closing)
    {
        $principal = $request->principal_amount;
        $interest = $request->total_interest_paid;
        $penalty = $request->penalty_amount ?? 0;

        $commonData = [
            'branch_id' => 1,
            'customer_id' => $fdrApplication->member_id,
            'tran_date' => $request->closing_date,
            'tran_type' => 'FDR_CLOSING',
            'naration' => $request->remarks ?? 'FDR Closing for ' . $fdrApplication->account_no,
            'status' => 'posted',
            'created_by' => Auth::id(),
        ];

        // 1. Debit Principal GL (Liability)
        $principalGlId = $fdrApplication->product->fdr_dep_lib_cr_gl_id;
        if ($principalGlId) {
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $principalGlId,
                'dr_amt' => $principal,
                'cr_amt' => 0,
            ]));
        }

        // 2. Debit Interest Expense GL
        if ($interest > 0) {
            $profitGlId = $fdrApplication->product->fdr_interest_exp_dr_gl_id;
            if ($profitGlId) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $profitGlId,
                    'dr_amt' => $interest,
                    'cr_amt' => 0,
                ]));
            }
        }

        // 3. Credit Penalty GL (if applicable)
        if ($penalty > 0) {
            $penaltyGlId = $fdrApplication->product->fdr_penalty_income_cr_gl_id;
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

        // 4. Credit Cash/Bank GL (Asset)
        $totalPayment = $principal + $interest - $penalty;
        
        $cashGlId = $fdrApplication->product->fdr_cash_bank_dr_gl_id;
        if (!$cashGlId) {
            $cashGlMap = GlMstMapping::where('gl_code_type', 'CASH')->where('status', true)->first();
            $cashGlId = $cashGlMap ? $cashGlMap->gl_mst_id : null;
        }

        if ($cashGlId) {
            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $cashGlId,
                'dr_amt' => 0,
                'cr_amt' => $totalPayment,
            ]));
        } else {
            throw new \Exception("FDR Cash / Bank Dr GL not found");
        }
    }
}
