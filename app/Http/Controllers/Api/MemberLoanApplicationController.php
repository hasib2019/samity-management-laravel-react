<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberLoanApplication;
use App\Models\Product;
use App\Services\MemberLoanService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MemberLoanApplicationController extends Controller
{
    public function __construct(private MemberLoanService $memberLoanService)
    {
    }

    public function index(Request $request)
    {
        $query = MemberLoanApplication::with(['samity', 'member', 'product', 'account'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'samity_id' => 'required|exists:samity_profiles,id',
            'member_id' => 'required|exists:member_infos,id',
            'product_id' => 'required|exists:product_mst,id',
            'application_date' => 'required|date',
            'requested_amount' => 'required|numeric|min:1',
            'tenure_months' => 'required|integer|min:1',
            'monthly_interest_rate' => 'nullable|numeric|min:0',
            'purpose' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $product = Product::findOrFail($request->product_id);
        if ($product->product_type !== 'member_loan') {
            return response()->json(['message' => 'Selected product is not a Member Loan product.'], 422);
        }

        $monthlyRate = (float) ($request->monthly_interest_rate ?? $product->profit_rate ?? 1);
        $scheduledEmi = $this->memberLoanService->calculateEmi((float) $request->requested_amount, $monthlyRate, (int) $request->tenure_months);

        $application = MemberLoanApplication::create([
            'samity_id' => $request->samity_id,
            'member_id' => $request->member_id,
            'product_id' => $request->product_id,
            'application_no' => 'MLA-' . now()->format('YmdHis') . random_int(10, 99),
            'application_date' => $request->application_date,
            'requested_amount' => $request->requested_amount,
            'tenure_months' => $request->tenure_months,
            'monthly_interest_rate' => $monthlyRate,
            'scheduled_emi' => $scheduledEmi,
            'installment_day' => 1,
            'purpose' => $request->purpose,
            'remarks' => $request->remarks,
            'status' => 'pending',
            'created_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Member loan application created successfully',
            'data' => $application->load(['samity', 'member', 'product']),
        ], 201);
    }

    public function show($id)
    {
        $application = MemberLoanApplication::with(['samity', 'member', 'product', 'account'])->find($id);

        if (!$application) {
            return response()->json(['message' => 'Member loan application not found'], 404);
        }

        return response()->json($application);
    }

    public function approve(Request $request, $id)
    {
        $application = MemberLoanApplication::find($id);
        if (!$application) {
            return response()->json(['message' => 'Member loan application not found'], 404);
        }

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Only pending applications can be approved'], 422);
        }

        $validator = Validator::make($request->all(), [
            'approved_date' => 'required|date',
            'approved_amount' => 'nullable|numeric|min:1',
            'monthly_interest_rate' => 'nullable|numeric|min:0',
            'tenure_months' => 'nullable|integer|min:1',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $application = $this->memberLoanService->approveApplication($application, $validator->validated());

        return response()->json([
            'message' => 'Member loan application approved successfully',
            'data' => $application,
        ]);
    }

    public function reject(Request $request, $id)
    {
        $application = MemberLoanApplication::find($id);
        if (!$application) {
            return response()->json(['message' => 'Member loan application not found'], 404);
        }

        if ($application->status !== 'pending') {
            return response()->json(['message' => 'Only pending applications can be rejected'], 422);
        }

        $application = $this->memberLoanService->rejectApplication($application, $request->input('remarks'));

        return response()->json([
            'message' => 'Member loan application rejected successfully',
            'data' => $application,
        ]);
    }
}
