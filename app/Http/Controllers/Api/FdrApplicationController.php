<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FdrApplication;
use App\Models\FdrNominee;
use App\Models\FdrClosing;
use App\Models\FdrCollection;
use App\Models\Product;
use App\Helpers\FdrCalculationHelper;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class FdrApplicationController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:fdr.application.view|fdr.list.view')->only(['index']);
        $this->middleware('permission:fdr.application.view')->only(['show']);
        $this->middleware('permission:fdr.application.create')->only(['store']);
        $this->middleware('permission:fdr.application.edit')->only(['update']);
        $this->middleware('permission:fdr.application.delete')->only(['destroy']);
    }

    /**
     * List all FDR applications
     */
    public function index(Request $request)
    {
        $query = FdrApplication::with(['member', 'product', 'nominees', 'closings', 'collections']);

        if ($request->member_id) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('account_no', 'like', "%$search%")
                  ->orWhereHas('member', function($sq) use ($search) {
                      $sq->where('member_code', 'like', "%$search%")
                        ->orWhere('member_name', 'like', "%$search%");
                  });
            });
        }

        $fdrApplications = $query->latest()->paginate(20);
        
        // Add calculated fields
        $fdrApplications->getCollection()->transform(function ($item) {
            $item->setAttribute('is_matured', FdrCalculationHelper::isMatured(Carbon::parse($item->maturity_date)));
            $item->setAttribute('months_remaining', FdrCalculationHelper::monthsRemaining(Carbon::parse($item->maturity_date)));
            return $item;
        });

        return response()->json($fdrApplications);
    }

    /**
     * Create new FDR application
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_id' => 'required|exists:member_infos,id',
            'product_id' => 'required|exists:product_mst,id',
            'fdr_amount' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'interest_rate' => 'nullable|numeric|min:0',
            'interest_payment_type' => 'required|in:monthly,quarterly,half_yearly,yearly,maturity',
            'nominees' => 'nullable|array',
            'nominees.*.nominee_name' => 'required_with:nominees|string',
            'nominees.*.relation' => 'required_with:nominees|string',
            'nominees.*.percentage' => 'required_with:nominees|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $product = Product::findOrFail($request->product_id);
            
            // Auto-generate account number
            $accountNo = 'FDR-' . date('Ymd') . '-' . rand(10000, 99999);

            // Calculate maturity date
            $startDate = Carbon::parse($request->start_date);
            $maturityDate = $startDate->copy()->addMonths((int)$request->duration);
            
            // Calculate maturity amount with interest
            $interestRate = $request->interest_rate ?? $product->profit_rate ?? 0;
            $maturityAmount = FdrCalculationHelper::calculateMaturityAmount(
                $request->fdr_amount,
                $interestRate,
                $request->duration
            );

            // Create Application
            $fdrApplication = FdrApplication::create([
                'member_id' => $request->member_id,
                'product_id' => $request->product_id,
                'account_no' => $accountNo,
                'fdr_amount' => $request->fdr_amount,
                'duration' => $request->duration,
                'interest_rate' => $interestRate,
                'interest_payment_type' => $request->interest_payment_type,
                'start_date' => $startDate,
                'maturity_date' => $maturityDate,
                'maturity_amount' => $maturityAmount,
                'status' => 'active',
                'created_by' => Auth::id(),
            ]);

            // Create Nominees
            if ($request->has('nominees')) {
                foreach ($request->nominees as $index => $nomineeData) {
                    // Handle Image Upload
                    if ($request->hasFile("nominees.{$index}.image")) {
                        $image = $request->file("nominees.{$index}.image");
                        $imageName = time() . '_' . $index . '_nominee.' . $image->getClientOriginalExtension();
                        $image->move(public_path('uploads/fdr_docs/nominee'), $imageName);
                        $nomineeData['image'] = 'uploads/fdr_docs/nominee/' . $imageName;
                    } elseif (isset($nomineeData['image']) && is_string($nomineeData['image']) && strpos($nomineeData['image'], 'base64') !== false) {
                        // Handle Base64 Image
                        $image_parts = explode(";base64,", $nomineeData['image']);
                        $image_type_aux = explode("image/", $image_parts[0]);
                        $image_type = $image_type_aux[1];
                        $image_base64 = base64_decode($image_parts[1]);
                        $imageName = time() . '_' . $index . '_nominee.' . $image_type;
                        file_put_contents(public_path('uploads/fdr_docs/nominee/') . $imageName, $image_base64);
                        $nomineeData['image'] = 'uploads/fdr_docs/nominee/' . $imageName;
                    }

                    $fdrApplication->nominees()->create($nomineeData);
                }
            }

            // Generate first collection if periodic interest payment
            if ($fdrApplication->interest_payment_type !== 'maturity') {
                $nextCollectionDate = FdrCalculationHelper::getNextCollectionDate(
                    $startDate,
                    $fdrApplication->interest_payment_type
                );

                if ($nextCollectionDate->lte(Carbon::parse($fdrApplication->maturity_date))) {
                    $interest = FdrCalculationHelper::calculatePeriodicInterest(
                        $fdrApplication->fdr_amount,
                        $fdrApplication->interest_rate,
                        $fdrApplication->interest_payment_type
                    );

                    FdrCollection::create([
                        'fdr_application_id' => $fdrApplication->id,
                        'collection_date' => $nextCollectionDate,
                        'interest_amount' => $interest,
                        'period_from' => $startDate,
                        'period_to' => $nextCollectionDate,
                        'collection_type' => $fdrApplication->interest_payment_type,
                        'status' => 'pending',
                        'created_by' => Auth::id(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'FDR Application created successfully',
                'data' => $fdrApplication->load(['member', 'product', 'nominees', 'collections'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create FDR application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show FDR application details
     */
    public function show($id)
    {
        $fdrApplication = FdrApplication::with(['member', 'product', 'nominees', 'closings', 'collections'])->find($id);

        if (!$fdrApplication) {
            return response()->json(['message' => 'FDR Application not found'], 404);
        }

        // Add calculated fields
        $fdrApplication->is_matured = FdrCalculationHelper::isMatured(Carbon::parse($fdrApplication->maturity_date));
        $fdrApplication->months_remaining = FdrCalculationHelper::monthsRemaining(Carbon::parse($fdrApplication->maturity_date));
        $fdrApplication->total_interest_collected = $fdrApplication->collections()
            ->where('status', 'collected')
            ->sum('interest_amount');

        return response()->json($fdrApplication);
    }

    /**
     * Update FDR application
     */
    public function update(Request $request, $id)
    {
        $fdrApplication = FdrApplication::find($id);

        if (!$fdrApplication) {
            return response()->json(['message' => 'FDR Application not found'], 404);
        }

        // Only allow updating active FDRs before maturity
        if ($fdrApplication->status !== 'active') {
            return response()->json(['message' => 'Cannot update non-active FDR accounts'], 400);
        }

        $validator = Validator::make($request->all(), [
            'fdr_amount' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'interest_rate' => 'nullable|numeric|min:0',
            'interest_payment_type' => 'required|in:monthly,quarterly,half_yearly,yearly,maturity',
            'nominees' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Calculate maturity date
            $startDate = Carbon::parse($request->start_date);
            $maturityDate = $startDate->copy()->addMonths((int)$request->duration);
            
            // Calculate maturity amount
            $maturityAmount = FdrCalculationHelper::calculateMaturityAmount(
                $request->fdr_amount,
                $request->interest_rate ?? $fdrApplication->interest_rate,
                $request->duration
            );

            $fdrApplication->update([
                'fdr_amount' => $request->fdr_amount,
                'duration' => $request->duration,
                'start_date' => $startDate,
                'maturity_date' => $maturityDate,
                'maturity_amount' => $maturityAmount,
                'interest_rate' => $request->interest_rate ?? $fdrApplication->interest_rate,
                'interest_payment_type' => $request->interest_payment_type,
                'updated_by' => Auth::id(),
            ]);
            
            // Update Nominees
            if ($request->has('nominees')) {
                // Remove existing nominees
                $fdrApplication->nominees()->delete();

                foreach ($request->nominees as $index => $nomineeData) {
                    // Handle Image Upload
                    if ($request->hasFile("nominees.{$index}.image")) {
                        $image = $request->file("nominees.{$index}.image");
                        $imageName = time() . '_' . $index . '_nominee.' . $image->getClientOriginalExtension();
                        $image->move(public_path('uploads/fdr_docs/nominee'), $imageName);
                        $nomineeData['image'] = 'uploads/fdr_docs/nominee/' . $imageName;
                    } elseif (isset($nomineeData['image']) && is_string($nomineeData['image']) && strpos($nomineeData['image'], 'base64') !== false) {
                        // Handle Base64 Image
                        $image_parts = explode(";base64,", $nomineeData['image']);
                        $image_type_aux = explode("image/", $image_parts[0]);
                        $image_type = $image_type_aux[1];
                        $image_base64 = base64_decode($image_parts[1]);
                        $imageName = time() . '_' . $index . '_nominee.' . $image_type;
                        file_put_contents(public_path('uploads/fdr_docs/nominee/') . $imageName, $image_base64);
                        $nomineeData['image'] = 'uploads/fdr_docs/nominee/' . $imageName;
                    }

                    $fdrApplication->nominees()->create($nomineeData);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'FDR Application updated successfully',
                'data' => $fdrApplication->load(['member', 'product', 'nominees'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update FDR application',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete FDR application (only active ones that haven't been used)
     */
    public function destroy($id)
    {
        $fdrApplication = FdrApplication::find($id);

        if (!$fdrApplication) {
            return response()->json(['message' => 'FDR Application not found'], 404);
        }

        // Check if there are any closings or collections
        if ($fdrApplication->closings()->exists() || FdrCollection::where('fdr_application_id', $id)->where('status', 'collected')->exists()) {
            return response()->json(['message' => 'Cannot delete FDR with existing transactions'], 400);
        }

        try {
            DB::beginTransaction();

            // Delete nominees and collections
            $fdrApplication->nominees()->delete();
            $fdrApplication->collections()->delete();
            $fdrApplication->delete();

            DB::commit();

            return response()->json(['message' => 'FDR Application deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete FDR application',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

