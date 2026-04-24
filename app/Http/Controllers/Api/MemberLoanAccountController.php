<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MemberLoanAccount;
use App\Services\MemberLoanService;
use Illuminate\Http\Request;

class MemberLoanAccountController extends Controller
{
    public function __construct(private MemberLoanService $memberLoanService)
    {
    }

    public function index(Request $request)
    {
        $query = MemberLoanAccount::with(['member', 'samity', 'product', 'application'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        $account = MemberLoanAccount::with([
            'member',
            'samity',
            'product',
            'application',
            'transactions',
        ])->find($id);

        if (!$account) {
            return response()->json(['message' => 'Member loan account not found'], 404);
        }

        return response()->json($account);
    }

    public function balance($id)
    {
        $account = MemberLoanAccount::find($id);
        if (!$account) {
            return response()->json(['message' => 'Member loan account not found'], 404);
        }

        $asOfDate = request()->input('as_of_date');
        return response()->json(
            $asOfDate
                ? $this->memberLoanService->previewBalance($account, $asOfDate)
                : $this->memberLoanService->balance($account)
        );
    }

    public function history($id)
    {
        $account = MemberLoanAccount::find($id);
        if (!$account) {
            return response()->json(['message' => 'Member loan account not found'], 404);
        }

        return response()->json(
            $account->transactions()->orderByDesc('transaction_date')->orderByDesc('id')->get()
        );
    }

    public function statement(Request $request, $id)
    {
        $account = MemberLoanAccount::find($id);
        if (!$account) {
            return response()->json(['message' => 'Member loan account not found'], 404);
        }

        $month = $request->input('month', now()->format('Y-m'));
        return response()->json($this->memberLoanService->statement($account, $month));
    }

    public function accrue(Request $request, $id)
    {
        $account = MemberLoanAccount::find($id);
        if (!$account) {
            return response()->json(['message' => 'Member loan account not found'], 404);
        }

        $validatedDate = $request->input('as_of_date', now()->toDateString());
        $account = $this->memberLoanService->accrueUntil($account, $validatedDate, $request->input('remarks'));

        return response()->json([
            'message' => 'Member loan accrual completed successfully',
            'data' => $account,
        ]);
    }
}
