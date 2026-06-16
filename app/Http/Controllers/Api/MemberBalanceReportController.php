<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DpsApplication;
use App\Models\FdrApplication;
use App\Models\LoanAccount;
use App\Models\MemberInfo;
use App\Models\MemberLoanAccount;
use App\Models\SamityProfile;
use App\Models\SavingsAccount;
use App\Models\ShareAccount;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MemberBalanceReportController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'samity_id' => 'required|exists:samity_profiles,id',
            'as_of'     => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $asOf   = Carbon::parse($request->as_of ?? now());
        $samity = SamityProfile::findOrFail($request->samity_id);

        $members = MemberInfo::where('samity_id', $samity->id)
            ->where('is_active', true)
            ->orderBy('member_code')
            ->get();

        $memberIds = $members->pluck('id');

        // All active balances keyed by member_id
        $shareAccounts = ShareAccount::whereIn('member_id', $memberIds)
            ->get()->keyBy('member_id');

        $savingsAccounts = SavingsAccount::whereIn('member_id', $memberIds)
            ->get()->keyBy('member_id');

        $dpsApplications = DpsApplication::whereIn('member_id', $memberIds)
            ->whereIn('status', ['active', 'matured'])
            ->get()->keyBy('member_id');

        $fdrApplications = FdrApplication::whereIn('member_id', $memberIds)
            ->whereIn('status', ['active', 'matured'])
            ->get()->keyBy('member_id');

        // Combine loan + member loan outstanding into one loan balance
        $loanAccounts = LoanAccount::whereIn('member_id', $memberIds)
            ->where('status', 'active')
            ->get()->keyBy('member_id');

        $memberLoanAccounts = MemberLoanAccount::whereIn('member_id', $memberIds)
            ->where('status', 'active')
            ->get()->keyBy('member_id');

        $rows = [];
        $totShare = $totSavings = $totDps = $totFdr = $totLoan = 0;

        foreach ($members as $i => $member) {
            $shareBalance   = (float) ($shareAccounts->get($member->id)?->current_balance ?? 0);
            $savingsBalance = (float) ($savingsAccounts->get($member->id)?->current_balance ?? 0);
            $dpsBalance     = (float) ($dpsApplications->get($member->id)?->balance ?? 0);
            $fdrBalance     = (float) ($fdrApplications->get($member->id)?->fdr_amount ?? 0);

            $loanBalance        = (float) ($loanAccounts->get($member->id)?->current_balance ?? 0);
            $memberLoanBalance  = (float) ($memberLoanAccounts->get($member->id)?->total_outstanding ?? 0);
            $totalLoan          = $loanBalance + $memberLoanBalance;

            // Skip rows that have no balance at all (optional: remove to show all members)
            $totShare   += $shareBalance;
            $totSavings += $savingsBalance;
            $totDps     += $dpsBalance;
            $totFdr     += $fdrBalance;
            $totLoan    += $totalLoan;

            $rows[] = [
                'serial'          => $i + 1,
                'member_id'       => $member->id,
                'member_code'     => $member->member_code,
                'member_name'     => $member->member_name,
                'share_balance'   => $shareBalance,
                'savings_balance' => $savingsBalance,
                'dps_balance'     => $dpsBalance,
                'fdr_balance'     => $fdrBalance,
                'loan_balance'    => $totalLoan,
            ];
        }

        return response()->json([
            'data' => [
                'samity'     => ['id' => $samity->id, 'name' => $samity->samity_name],
                'as_of'      => $asOf->format('d/m/Y'),
                'as_of_raw'  => $asOf->toDateString(),
                'rows'       => $rows,
                'totals' => [
                    'share'   => round($totShare, 2),
                    'savings' => round($totSavings, 2),
                    'dps'     => round($totDps, 2),
                    'fdr'     => round($totFdr, 2),
                    'loan'    => round($totLoan, 2),
                ],
            ],
        ]);
    }
}
