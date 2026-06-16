<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DepositRequest;
use App\Models\DpsApplication;
use App\Models\DpsInstallment;
use App\Models\LoanAccount;
use App\Models\LoanRepaymentSchedule;
use App\Models\MemberInfo;
use App\Models\MemberLoanAccount;
use App\Models\SamityProfile;
use App\Models\SavingsAccount;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DailyCollectionSheetController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'samity_id' => 'required|exists:samity_profiles,id',
            'date'      => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $date    = Carbon::parse($request->date ?? now());
        $samity  = SamityProfile::findOrFail($request->samity_id);

        $fee     = (float) ($samity->monthly_subscription_fee ?? 0);
        $penalty = (float) ($samity->penalty_amount ?? 0);
        $lateDay = (int)  ($samity->penalty_late_date ?? 15);

        // All active members of this samity
        $members   = MemberInfo::where('samity_id', $samity->id)
            ->where('is_active', true)
            ->orderBy('member_code')
            ->get();

        $memberIds = $members->pluck('id');

        // ── Subscription deposits for this month ────────────────────────────
        $subDeposits = DepositRequest::whereIn('member_id', $memberIds)
            ->where('is_subscription', true)
            ->where('period_year', $date->year)
            ->where('period_month', $date->month)
            ->whereNotIn('status', ['rejected', 'cancelled'])
            ->get()
            ->keyBy('member_id');

        // ── Savings accounts ────────────────────────────────────────────────
        $savingsAccounts = SavingsAccount::whereIn('member_id', $memberIds)
            ->get()
            ->keyBy('member_id');

        // ── Loan accounts (active) ──────────────────────────────────────────
        $loanAccounts = LoanAccount::whereIn('member_id', $memberIds)
            ->where('status', 'active')
            ->get()
            ->keyBy('member_id');

        // Loan installments for this month
        $loanAppIds      = $loanAccounts->pluck('loan_application_id');
        $loanInstallments = LoanRepaymentSchedule::whereIn('loan_application_id', $loanAppIds)
            ->whereYear('due_date', $date->year)
            ->whereMonth('due_date', $date->month)
            ->get()
            ->keyBy('loan_application_id');

        // ── Member loan accounts (active) ───────────────────────────────────
        $memberLoanAccounts = MemberLoanAccount::whereIn('member_id', $memberIds)
            ->where('status', 'active')
            ->get()
            ->keyBy('member_id');

        // ── DPS applications (active) ───────────────────────────────────────
        $dpsApplications = DpsApplication::whereIn('member_id', $memberIds)
            ->where('status', 'active')
            ->get()
            ->keyBy('member_id');

        $dpsAppIds    = $dpsApplications->pluck('id');
        $dpsInstallments = DpsInstallment::whereIn('dps_application_id', $dpsAppIds)
            ->whereYear('due_date', $date->year)
            ->whereMonth('due_date', $date->month)
            ->get()
            ->keyBy('dps_application_id');

        // ── Build rows ──────────────────────────────────────────────────────
        $dueDate = $date->copy()->day(min($lateDay, $date->daysInMonth));
        $isLate  = $date->gt($dueDate);

        $rows          = [];
        $totalSavingsDue  = 0;
        $totalLoanInstall = 0;
        $totalMemberLoan  = 0;
        $totalDps         = 0;

        foreach ($members as $i => $member) {
            // ── Savings subscription ────────────────────────────────────────
            $subDeposit  = $subDeposits->get($member->id);
            $subStatus   = 'due';
            if ($subDeposit) {
                $subStatus = $subDeposit->status === 'approved' ? 'paid' : 'pending';
            } elseif ($isLate) {
                $subStatus = 'overdue';
            }
            $monthPenalty  = in_array($subStatus, ['overdue']) ? $penalty : 0;
            $savingsDue    = $subStatus === 'paid' ? 0 : $fee + $monthPenalty;
            $savingsAccount = $savingsAccounts->get($member->id);

            // ── Loan ────────────────────────────────────────────────────────
            $loanAccount     = $loanAccounts->get($member->id);
            $loanInstallment = null;
            if ($loanAccount) {
                $loanInstallment = $loanInstallments->get($loanAccount->loan_application_id);
            }
            $loanDue = $loanInstallment && $loanInstallment->status !== 'paid'
                ? (float) $loanInstallment->total_amount
                : 0;

            // ── Member Loan ─────────────────────────────────────────────────
            $memberLoanAccount = $memberLoanAccounts->get($member->id);
            $memberLoanDue     = 0;
            if ($memberLoanAccount) {
                // Monthly installment = total_outstanding / remaining months (approx)
                // Use accrued interest + a principal portion as monthly expectation
                $memberLoanDue = (float) $memberLoanAccount->total_outstanding > 0
                    ? round((float) $memberLoanAccount->accrued_interest_balance + (float) $memberLoanAccount->overdue_interest_balance, 2)
                    : 0;
            }

            // ── DPS ─────────────────────────────────────────────────────────
            $dpsApp         = $dpsApplications->get($member->id);
            $dpsInstallment = null;
            if ($dpsApp) {
                $dpsInstallment = $dpsInstallments->get($dpsApp->id);
            }
            $dpsDue = ($dpsApp && (!$dpsInstallment || $dpsInstallment->status !== 'paid'))
                ? (float) ($dpsApp->dps_amount ?? 0)
                : 0;

            // ── Accumulate totals ───────────────────────────────────────────
            $totalSavingsDue  += $savingsDue;
            $totalLoanInstall += $loanDue;
            $totalMemberLoan  += $memberLoanDue;
            $totalDps         += $dpsDue;

            $rows[] = [
                'serial'      => $i + 1,
                'member_id'   => $member->id,
                'member_code' => $member->member_code,
                'member_name' => $member->member_name,

                'savings' => [
                    'account_number'  => $savingsAccount?->account_number,
                    'current_balance' => (float) ($savingsAccount?->current_balance ?? 0),
                    'monthly_fee'     => $fee,
                    'penalty'         => $monthPenalty,
                    'total_due'       => $savingsDue,
                    'status'          => $subStatus,
                ],

                'loan' => $loanAccount ? [
                    'account_no'          => $loanAccount->account_no,
                    'installment_no'      => $loanInstallment?->installment_no,
                    'principal_amount'    => (float) $loanAccount->principal_amount,
                    'installment_amount'  => $loanInstallment ? (float) $loanInstallment->total_amount : null,
                    'outstanding_balance' => (float) $loanAccount->current_balance,
                    'status'              => $loanInstallment?->status ?? 'active',
                ] : null,

                'member_loan' => $memberLoanAccount ? [
                    'account_no'          => $memberLoanAccount->account_no,
                    'outstanding_balance' => (float) $memberLoanAccount->total_outstanding,
                    'monthly_due'         => $memberLoanDue,
                    'status'              => $memberLoanAccount->status,
                ] : null,

                'dps' => $dpsApp ? [
                    'account_no'       => $dpsApp->account_no,
                    'installment_no'   => $dpsInstallment?->installment_no,
                    'monthly_amount'   => (float) $dpsApp->dps_amount,
                    'fine_amount'      => (float) ($dpsInstallment?->fine_amount ?? 0),
                    'balance'          => (float) $dpsApp->balance,
                    'status'           => $dpsInstallment?->status ?? 'due',
                ] : null,
            ];
        }

        return response()->json([
            'data' => [
                'samity' => [
                    'id'                      => $samity->id,
                    'name'                    => $samity->samity_name,
                    'code'                    => $samity->samity_code ?? '',
                    'monthly_subscription_fee'=> $fee,
                    'penalty_amount'          => $penalty,
                    'penalty_late_date'       => $lateDay,
                ],
                'date'        => $date->toDateString(),
                'month_label' => $date->translatedFormat('F Y'),
                'rows'        => $rows,
                'totals' => [
                    'savings_due'  => round($totalSavingsDue, 2),
                    'loan_install' => round($totalLoanInstall, 2),
                    'member_loan'  => round($totalMemberLoan, 2),
                    'dps'          => round($totalDps, 2),
                    'grand_total'  => round($totalSavingsDue + $totalLoanInstall + $totalMemberLoan + $totalDps, 2),
                ],
            ],
        ]);
    }
}
