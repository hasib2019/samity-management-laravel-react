<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DpsApplication;
use App\Models\DpsInstallment;
use App\Models\DpsNominee;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DpsApplicationController extends Controller
{
    public function index(Request $request)
    {
        $query = DpsApplication::with(['member', 'product']);

        if ($request->member_id) {
            $query->where('member_id', $request->member_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $dpsApplications = $query->latest()->paginate(20);
        return response()->json($dpsApplications);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_id' => 'required|exists:member_infos,id',
            'product_id' => 'required|exists:product_mst,id',
            'dps_amount' => 'required|numeric|min:0',
            'duration' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'interest_rate' => 'nullable|numeric|min:0',
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
            $accountNo = 'DPS-' . date('Ymd') . '-' . rand(1000, 9999);

            // Calculate maturity date
            $startDate = Carbon::parse($request->start_date);
            $maturityDate = $startDate->copy()->addMonths((int)$request->duration);

            // Create Application
            $dpsApplication = DpsApplication::create([
                'member_id' => $request->member_id,
                'product_id' => $request->product_id,
                'account_no' => $accountNo,
                'dps_amount' => $request->dps_amount,
                'duration' => $request->duration,
                'interest_rate' => $request->interest_rate ?? $product->profit_rate ?? 0,
                'total_installment' => $request->duration,
                'start_date' => $startDate,
                'maturity_date' => $maturityDate,
                'status' => 'active',
                'created_by' => auth()->id(),
            ]);

            // Create Nominees
            if ($request->has('nominees')) {
                foreach ($request->nominees as $nomineeData) {
                    $dpsApplication->nominees()->create($nomineeData);
                }
            }

            // Generate Installments
            $installments = [];
            $duration = (int)$request->duration;
            for ($i = 1; $i <= $duration; $i++) {
                // First installment due on start date? Or next month?
                // Standard: Start date is opening date. 1st installment usually paid on opening.
                // But let's follow the code: $startDate->copy()->addMonths($i - 1)
                // i=1 -> addMonths(0) -> Start Date. Correct.
                
                $dueDate = $startDate->copy()->addMonths($i - 1);

                $installments[] = [
                    'dps_application_id' => $dpsApplication->id,
                    'installment_no' => $i,
                    'due_date' => $dueDate,
                    'amount' => $request->dps_amount,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            DpsInstallment::insert($installments);

            DB::commit();

            return response()->json([
                'message' => 'DPS Application created successfully',
                'data' => $dpsApplication->load('installments', 'nominees')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create DPS Application: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $dpsApplication = DpsApplication::with(['member', 'product', 'installments', 'nominees'])->findOrFail($id);
        return response()->json($dpsApplication);
    }
}
