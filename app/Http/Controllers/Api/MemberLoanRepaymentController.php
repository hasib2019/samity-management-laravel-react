<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberLoanAccount;
use App\Services\MemberLoanService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MemberLoanRepaymentController extends Controller
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

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($inner) use ($term) {
                $inner->where('account_no', 'like', "%{$term}%")
                    ->orWhereHas('member', function ($q) use ($term) {
                        $q->where('member_name', 'like', "%{$term}%")
                            ->orWhere('member_code', 'like', "%{$term}%");
                    });
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'required|exists:member_loan_accounts,id',
            'payment_date' => 'required|date',
            'payment_amount' => 'nullable|numeric|min:0',
            'emi_amount' => 'nullable|numeric|min:0',
            'interest_amount' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $account = MemberLoanAccount::findOrFail($request->account_id);
        $account = $this->memberLoanService->processRepayment($account, $validator->validated());

        return response()->json([
            'message' => 'Member loan repayment processed successfully',
            'data' => $account,
        ]);
    }
}
