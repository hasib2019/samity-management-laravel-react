<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberLoanApplication;
use App\Services\MemberLoanService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MemberLoanDisbursementController extends Controller
{
    public function __construct(private MemberLoanService $memberLoanService)
    {
    }

    public function index(Request $request)
    {
        $query = MemberLoanApplication::with(['samity', 'member', 'product'])
            ->where('status', 'approved')
            ->latest();

        if ($request->filled('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'application_id' => 'required|exists:member_loan_applications,id',
            'disbursed_date' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $application = MemberLoanApplication::findOrFail($request->application_id);
        $account = $this->memberLoanService->disburseApplication($application, $request->disbursed_date, $request->remarks);

        return response()->json([
            'message' => 'Member loan disbursed successfully',
            'data' => $account,
        ], 201);
    }
}
