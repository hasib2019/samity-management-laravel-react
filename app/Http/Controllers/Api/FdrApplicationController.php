<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FdrApplication;
use App\Models\FdrNominee;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class FdrApplicationController extends Controller
{
    public function index(Request $request)
    {
        $query = FdrApplication::with(['member', 'product']);

        if ($request->member_id) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $fdrApplications = $query->latest()->paginate(20);
        return response()->json($fdrApplications);
    }

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
            $accountNo = 'FDR-' . date('Ymd') . '-' . rand(1000, 9999);

            // Calculate maturity date
            $startDate = Carbon::parse($request->start_date);
            $maturityDate = $startDate->copy()->addMonths((int)$request->duration);

            // Create Application
            $fdrApplication = FdrApplication::create([
                'member_id' => $request->member_id,
                'product_id' => $request->product_id,
                'account_no' => $accountNo,
                'fdr_amount' => $request->fdr_amount,
                'duration' => $request->duration,
                'interest_rate' => $request->interest_rate ?? $product->profit_rate ?? 0,
                'interest_payment_type' => $request->interest_payment_type,
                'start_date' => $startDate,
                'maturity_date' => $maturityDate,
                'status' => 'active',
                'created_by' => Auth::id(),
            ]);

            // Create Nominees
            if ($request->has('nominees')) {
                foreach ($request->nominees as $nomineeData) {
                    $fdrApplication->nominees()->create($nomineeData);
                }
            }

            DB::commit();

            return response()->json(['message' => 'FDR Application created successfully', 'data' => $fdrApplication], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create FDR application', 'error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $fdrApplication = FdrApplication::with(['member', 'product', 'nominees'])->find($id);

        if (!$fdrApplication) {
            return response()->json(['message' => 'FDR Application not found'], 404);
        }

        return response()->json($fdrApplication);
    }

    public function update(Request $request, $id)
    {
        $fdrApplication = FdrApplication::find($id);

        if (!$fdrApplication) {
            return response()->json(['message' => 'FDR Application not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'fdr_amount' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'interest_rate' => 'nullable|numeric|min:0',
            'interest_payment_type' => 'required|in:monthly,quarterly,half_yearly,yearly,maturity',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            // Calculate maturity date
            $startDate = Carbon::parse($request->start_date);
            $maturityDate = $startDate->copy()->addMonths((int)$request->duration);

            $fdrApplication->update([
                'fdr_amount' => $request->fdr_amount,
                'duration' => $request->duration,
                'start_date' => $startDate,
                'maturity_date' => $maturityDate,
                'interest_rate' => $request->interest_rate,
                'interest_payment_type' => $request->interest_payment_type,
                'updated_by' => Auth::id(),
            ]);
            
             // Update Nominees
            if ($request->has('nominees')) {
                // Remove existing nominees
                $fdrApplication->nominees()->delete();

                foreach ($request->nominees as $nomineeData) {
                    $fdrApplication->nominees()->create($nomineeData);
                }
            }

            DB::commit();

            return response()->json(['message' => 'FDR Application updated successfully', 'data' => $fdrApplication]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update FDR application', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $fdrApplication = FdrApplication::find($id);

        if (!$fdrApplication) {
            return response()->json(['message' => 'FDR Application not found'], 404);
        }

        // Check if there are any transactions (not implemented yet, but good practice)
        // if ($fdrApplication->transactions()->exists()) {
        //     return response()->json(['message' => 'Cannot delete FDR Application with existing transactions'], 400);
        // }

        $fdrApplication->delete();

        return response()->json(['message' => 'FDR Application deleted successfully']);
    }
}
