<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DepositRequest;
use App\Models\MemberInfo;
use App\Models\SamityProfile;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class MemberSubscriptionDueController extends Controller
{
    /**
     * Month-wise subscription schedule for a member.
     *
     * For every month from the member's start (admission date, else samity
     * formation date) up to the as-of date, the member owes the samity's monthly
     * subscription fee. A penalty is added for any month whose cutoff day
     * (penalty_late_date) has already passed while still unpaid.
     *
     * Payments are tracked by tagging deposits with the month they cover
     * (deposit_requests.is_subscription + period_year/period_month). A month is
     * "paid" once an approved subscription deposit exists for it, "pending" when
     * one is awaiting approval, otherwise "overdue"/"due".
     */
    public function show(Request $request)
    {
        if (! Auth::user()->can('subscription.due.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'member_id' => 'required|exists:member_infos,id',
            'as_of' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        [$member, $samity, $error] = $this->resolveMemberAndSamity($request->member_id);
        if ($error) {
            return $error;
        }

        $asOf = $request->as_of ? Carbon::parse($request->as_of) : Carbon::today();
        $schedule = $this->computeSchedule($member, $samity, $asOf);
        if ($schedule instanceof \Illuminate\Http\JsonResponse) {
            return $schedule;
        }

        return response()->json(['data' => $schedule]);
    }

    /**
     * The next unpaid subscription month for a member, with the amount payable
     * (fee + penalty if overdue). Drives the deposit form's auto-calculation.
     */
    public function nextDue(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_id' => 'required|exists:member_infos,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        [$member, $samity, $error] = $this->resolveMemberAndSamity($request->member_id);
        if ($error) {
            return $error;
        }

        $schedule = $this->computeSchedule($member, $samity, Carbon::today());
        if ($schedule instanceof \Illuminate\Http\JsonResponse) {
            return $schedule;
        }

        return response()->json([
            'data' => [
                'member_id' => (int) $member->id,
                'monthly_fee' => $schedule['samity']['monthly_subscription_fee'],
                'penalty_amount' => $schedule['samity']['penalty_amount'],
                'penalty_late_date' => $schedule['samity']['penalty_late_date'],
                'next_due' => $schedule['next_due'],
                'unpaid_months' => array_values(array_filter(
                    $schedule['months'],
                    fn ($m) => in_array($m['status'], ['due', 'overdue'], true)
                )),
                'summary' => $schedule['summary'],
            ],
        ]);
    }

    /** Resolve a member + their samity (or a JSON error response). */
    private function resolveMemberAndSamity($memberId): array
    {
        $member = MemberInfo::find($memberId);
        if (! $member) {
            return [null, null, response()->json(['message' => 'Member not found.'], 404)];
        }

        $samity = SamityProfile::find($member->samity_id) ?? SamityProfile::first();
        if (! $samity) {
            return [null, null, response()->json(['message' => 'Samity profile is not configured.'], 422)];
        }

        return [$member, $samity, null];
    }

    /**
     * Build the month-wise schedule with paid/due/overdue status per month.
     *
     * @return array|\Illuminate\Http\JsonResponse
     */
    private function computeSchedule(MemberInfo $member, SamityProfile $samity, Carbon $asOf)
    {
        $fee = (float) $samity->monthly_subscription_fee;
        $penalty = (float) $samity->penalty_amount;
        $lateDay = (int) ($samity->penalty_late_date ?: 15);

        $startSource = $member->member_admission_date ?: $samity->samity_formation_date;
        if (! $startSource) {
            return response()->json([
                'message' => 'No start date found: set the member admission date or the samity formation date.',
            ], 422);
        }

        $start = Carbon::parse($startSource)->startOfMonth();

        // Map of paid/pending subscription deposits keyed by "year-month".
        $deposits = DepositRequest::where('member_id', $member->id)
            ->where('is_subscription', true)
            ->whereNotIn('status', ['rejected', 'cancelled'])
            ->whereNotNull('period_year')
            ->whereNotNull('period_month')
            ->get()
            ->keyBy(fn ($d) => $d->period_year . '-' . $d->period_month);

        $months = [];
        $totalFee = 0.0;
        $totalPenalty = 0.0;
        $totalPaid = 0.0;
        $totalOutstanding = 0.0;
        $paidCount = 0;
        $overdueCount = 0;
        $pendingCount = 0;
        $nextDue = null;

        $cursor = $start->copy();
        while ($cursor->lte($asOf->copy()->startOfMonth())) {
            $dueDate = $cursor->copy()->day(min($lateDay, $cursor->daysInMonth));
            $isLate = $asOf->gt($dueDate);
            $key = $cursor->year . '-' . $cursor->month;
            $deposit = $deposits->get($key);

            if ($deposit && $deposit->status === 'approved') {
                $status = 'paid';
                $monthFee = (float) $deposit->amount;                                     // fee only
                $monthPenalty = (float) $deposit->penalty_amount;
                $paidAmount = $monthFee + $monthPenalty;                                  // total paid
                $totalPaid += $paidAmount;
                $paidCount++;
            } elseif ($deposit) {
                $status = 'pending';
                $monthFee = $fee;
                $monthPenalty = $isLate ? $penalty : 0.0;
                $paidAmount = 0.0;
                $pendingCount++;
            } else {
                $status = $isLate ? 'overdue' : 'due';
                $monthFee = $fee;
                $monthPenalty = $isLate ? $penalty : 0.0;
                $paidAmount = 0.0;
                $totalOutstanding += $monthFee + $monthPenalty;
                if ($isLate) {
                    $overdueCount++;
                }
                if ($nextDue === null) {
                    $nextDue = [
                        'year' => (int) $cursor->year,
                        'month' => (int) $cursor->month,
                        'month_label' => $cursor->format('F Y'),
                        'due_date' => $dueDate->toDateString(),
                        'subscription_fee' => round($fee, 2),
                        'penalty' => round($monthPenalty, 2),
                        'total' => round($fee + $monthPenalty, 2),
                        'is_overdue' => $isLate,
                    ];
                }
            }

            $months[] = [
                'year' => (int) $cursor->year,
                'month' => (int) $cursor->month,
                'month_label' => $cursor->format('F Y'),
                'due_date' => $dueDate->toDateString(),
                'subscription_fee' => round($monthFee, 2),
                'penalty' => round($monthPenalty, 2),
                'total' => round($monthFee + $monthPenalty, 2),
                'paid_amount' => round($paidAmount, 2),
                'status' => $status,
            ];

            $totalFee += $monthFee;
            $totalPenalty += $monthPenalty;

            $cursor->addMonthNoOverflow();
        }

        return [
            'member' => [
                'id' => $member->id,
                'name' => $member->member_name,
                'code' => $member->member_code,
                'admission_date' => $member->member_admission_date,
            ],
            'samity' => [
                'name' => $samity->samity_name,
                'formation_date' => $samity->samity_formation_date,
                'monthly_subscription_fee' => round($fee, 2),
                'penalty_amount' => round($penalty, 2),
                'penalty_late_date' => $lateDay,
            ],
            'start_date' => $start->toDateString(),
            'as_of' => $asOf->toDateString(),
            'months' => $months,
            'next_due' => $nextDue,
            'summary' => [
                'months_count' => count($months),
                'paid_months' => $paidCount,
                'pending_months' => $pendingCount,
                'overdue_months' => $overdueCount,
                'total_subscription' => round($totalFee, 2),
                'total_penalty' => round($totalPenalty, 2),
                'total_paid' => round($totalPaid, 2),
                'total_outstanding' => round($totalOutstanding, 2),
            ],
        ];
    }
}
