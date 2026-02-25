<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FdrApplication;
use App\Models\FdrCollection;
use App\Models\GlMstMapping;
use App\Models\Transaction;
use App\Helpers\FdrCalculationHelper;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FdrCollectionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:fdr.collection.view')->only(['index', 'search']);
        $this->middleware('permission:fdr.collection.create')->only(['store']);
        $this->middleware('permission:fdr.collection.edit')->only(['update']);
        $this->middleware('permission:fdr.collection.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = FdrCollection::with(['fdrApplication.member', 'fdrApplication.product']);

        if ($request->fdr_application_id) {
            $query->where('fdr_application_id', $request->fdr_application_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->collection_type) {
            $query->where('collection_type', $request->collection_type);
        }

        $collections = $query->latest()->paginate(20);
        return response()->json($collections);
    }

    /**
     * Search for pending FDR collections by account number or member code
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $query = $request->input('query');

        $fdrApplication = FdrApplication::with([
            'member',
            'product',
            'collections' => function($q) {
                $q->where('status', 'pending')->orderBy('collection_date', 'asc');
            }
        ])
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

        return response()->json($fdrApplication);
    }

    /**
     * Record an interest collection/payment
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fdr_application_id' => 'required|exists:fdr_applications,id',
            'collection_date' => 'required|date',
            'interest_amount' => 'required|numeric|min:0',
            'period_from' => 'required|date',
            'period_to' => 'required|date',
            'collection_type' => 'required|in:monthly,quarterly,half_yearly,yearly',
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

            // Create FDR Collection Record
            $collection = FdrCollection::create([
                'fdr_application_id' => $fdrApplication->id,
                'collection_date' => $request->collection_date,
                'interest_amount' => $request->interest_amount,
                'period_from' => $request->period_from,
                'period_to' => $request->period_to,
                'collection_type' => $request->collection_type,
                'status' => 'collected',
                'remarks' => $request->remarks,
                'created_by' => Auth::id(),
            ]);

            // Create Accounting Transactions
            // Dr. Cash/Bank (Asset Increase)
            // Cr. Interest Income / FDR Interest GL (Income)

            $commonData = [
                'branch_id' => 1, // Default Branch
                'member_id' => $fdrApplication->member_id,
                'tran_date' => $request->collection_date,
                'tran_type' => 'FDR_COLLECTION',
                'description' => $request->remarks ?? 'FDR Interest Collection for ' . $fdrApplication->account_no,
                'status' => 'posted',
                'created_by' => Auth::id(),
            ];

            // 1. Debit Cash/Bank (Asset)
            $cashGlMap = GlMstMapping::where('gl_code_type', 'CASH_IN_HAND')->first();
            $cashGlId = $cashGlMap ? $cashGlMap->gl_mst_id : null;

            if (!$cashGlId) {
                throw new \Exception("Cash GL Mapping not found");
            }

            Transaction::create(array_merge($commonData, [
                'tran_num' => date('YmdHis') . rand(10, 99),
                'glac_id' => $cashGlId,
                'dr_amt' => $request->interest_amount,
                'cr_amt' => 0,
            ]));

            // 2. Credit Interest Income GL (Income)
            $profitGlId = $fdrApplication->product->gl_profit_id; // "Interest on FDR" (Income)
            
            if (!$profitGlId) {
                // Try to get from mapping
                $profitGlMap = GlMstMapping::where('gl_code_type', 'FDR_INTEREST_INCOME')->first();
                $profitGlId = $profitGlMap ? $profitGlMap->gl_mst_id : null;
            }

            if ($profitGlId) {
                Transaction::create(array_merge($commonData, [
                    'tran_num' => date('YmdHis') . rand(10, 99),
                    'glac_id' => $profitGlId,
                    'dr_amt' => 0,
                    'cr_amt' => $request->interest_amount,
                ]));
            } else {
                throw new \Exception("Interest GL not found");
            }

            DB::commit();

            return response()->json([
                'message' => 'Interest collection recorded successfully',
                'data' => $collection
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to record interest collection',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific collection record
     */
    public function show($id)
    {
        $collection = FdrCollection::with(['fdrApplication.member', 'fdrApplication.product'])->find($id);

        if (!$collection) {
            return response()->json(['message' => 'Collection record not found'], 404);
        }

        return response()->json($collection);
    }

    /**
     * Update a collection record
     */
    public function update(Request $request, $id)
    {
        $collection = FdrCollection::find($id);

        if (!$collection) {
            return response()->json(['message' => 'Collection record not found'], 404);
        }

        // Don't allow updating collected records in production
        if ($collection->status === 'collected') {
            return response()->json(['message' => 'Cannot update collected records'], 400);
        }

        $validator = Validator::make($request->all(), [
            'interest_amount' => 'required|numeric|min:0',
            'collection_date' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $collection->update([
                'interest_amount' => $request->interest_amount,
                'collection_date' => $request->collection_date,
                'remarks' => $request->remarks,
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Collection record updated successfully',
                'data' => $collection
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update collection record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete/Cancel a collection record
     */
    public function destroy($id)
    {
        $collection = FdrCollection::find($id);

        if (!$collection) {
            return response()->json(['message' => 'Collection record not found'], 404);
        }

        // Only allow deletion of pending records
        if ($collection->status !== 'pending') {
            return response()->json(['message' => 'Can only delete pending collection records'], 400);
        }

        try {
            $collection->status = 'cancelled';
            $collection->updated_by = Auth::id();
            $collection->save();

            return response()->json(['message' => 'Collection record cancelled successfully']);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to cancel collection record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate periodic collections for active FDRs
     * This can be called via command or scheduled job
     */
    public function generatePendingCollections(Request $request)
    {
        try {
            DB::beginTransaction();

            // Get all active FDRs with payment type != maturity
            $fdrApplications = FdrApplication::where('status', 'active')
                ->whereIn('interest_payment_type', ['monthly', 'quarterly', 'half_yearly', 'yearly'])
                ->get();

            $generated = 0;

            foreach ($fdrApplications as $fdr) {
                // Check if last collection was created and next one is due
                $lastCollection = FdrCollection::where('fdr_application_id', $fdr->id)
                    ->where('status', '!=', 'cancelled')
                    ->latest('period_to')
                    ->first();

                $nextCollectionDate = $lastCollection 
                    ? FdrCalculationHelper::getNextCollectionDate($lastCollection->period_to, $fdr->interest_payment_type)
                    : Carbon::parse($fdr->start_date);

                if (Carbon::now()->gte($nextCollectionDate) && Carbon::parse($fdr->maturity_date)->gt($nextCollectionDate)) {
                    // Calculate interest for this period
                    $interest = FdrCalculationHelper::calculatePeriodicInterest(
                        $fdr->fdr_amount,
                        $fdr->interest_rate,
                        $fdr->interest_payment_type
                    );

                    $periodFrom = $lastCollection ? $lastCollection->period_to->copy()->addDay() : Carbon::parse($fdr->start_date);
                    $periodTo = $nextCollectionDate;

                    FdrCollection::create([
                        'fdr_application_id' => $fdr->id,
                        'collection_date' => $nextCollectionDate,
                        'interest_amount' => $interest,
                        'period_from' => $periodFrom,
                        'period_to' => $periodTo,
                        'collection_type' => $fdr->interest_payment_type,
                        'status' => 'pending',
                        'created_by' => Auth::id() ?? 1,
                    ]);

                    $generated++;
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Pending collections generated successfully',
                'generated' => $generated
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to generate pending collections',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
