<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberLoanAccount;
use App\Services\MemberLoanService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MemberLoanClosingController extends Controller
{
    public function __construct(private MemberLoanService $memberLoanService)
    {
    }

    public function index(Request $request)
    {
        $query = MemberLoanAccount::with(['member', 'samity', 'product', 'application'])
            ->whereIn('status', ['active', 'overdue'])
            ->latest();

        if ($request->filled('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'required|exists:member_loan_accounts,id',
            'closing_date' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $account = MemberLoanAccount::findOrFail($request->account_id);
        $account = $this->memberLoanService->closeAccount($account, $validator->validated());

        return response()->json([
            'message' => 'Member loan closed successfully',
            'data' => $account,
        ]);
    }
}
