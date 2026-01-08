<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MemberInfo;
use App\Models\MonthlyCollection;
use App\Models\SamityProfile;
use Carbon\Carbon;

class FinancialReportController extends Controller
{
    public function dueReport(Request $request)
    {
        $samityProfile = SamityProfile::first();
        if (!$samityProfile) {
            return response()->json(['message' => 'Samity Profile not found'], 404);
        }

        $monthlyFee = $samityProfile->monthly_subscription_fee;
        $penaltyAmount = $samityProfile->penalty_amount;
        $penaltyDate = $samityProfile->penalty_late_date;

        $members = MemberInfo::where('is_active', true)->get();
        $report = [];
        $grandTotalDue = 0;
        $grandTotalPenalty = 0;

        foreach ($members as $member) {
            $admissionDate = Carbon::parse($member->member_admission_date);
            $currentDate = Carbon::now();
            
            // Get all paid months for this member
            $paidMonths = MonthlyCollection::where('member_id', $member->id)
                ->get(['month', 'year'])
                ->map(function ($item) {
                    return $item->year . '-' . $item->month;
                })
                ->toArray();

            $totalDue = 0;
            $totalPenalty = 0;
            $dueMonthsCount = 0;

            // Iterate from admission month to current month
            $start = $admissionDate->copy()->startOfMonth();
            $end = $currentDate->copy()->startOfMonth();

            // Safety check: if admission date is in future, skip
            if ($start->gt($end)) {
                continue;
            }

            while ($start->lte($end)) {
                $monthKey = $start->year . '-' . $start->month;

                if (!in_array($monthKey, $paidMonths)) {
                    $totalDue += $monthlyFee;
                    $dueMonthsCount++;

                    // Calculate penalty
                    $isPastMonth = $start->copy()->endOfMonth()->lt($currentDate->copy()->startOfMonth());
                    $isLateCurrentMonth = $start->month === $currentDate->month && 
                                          $start->year === $currentDate->year && 
                                          $currentDate->day > $penaltyDate;

                    if ($isPastMonth || $isLateCurrentMonth) {
                        $totalPenalty += $penaltyAmount;
                    }
                }
                
                $start->addMonth();
            }

            if ($totalDue > 0 || $totalPenalty > 0) {
                $report[] = [
                    'member_id' => $member->id,
                    'member_name' => $member->member_name,
                    'member_code' => $member->member_code,
                    'mobile' => $member->mobile,
                    'due_months_count' => $dueMonthsCount,
                    'basic_due' => $totalDue,
                    'penalty_due' => $totalPenalty,
                    'total_payable' => $totalDue + $totalPenalty
                ];
                $grandTotalDue += $totalDue;
                $grandTotalPenalty += $totalPenalty;
            }
        }

        return response()->json([
            'report' => $report,
            'summary' => [
                'total_members_with_due' => count($report),
                'grand_total_basic_due' => $grandTotalDue,
                'grand_total_penalty_due' => $grandTotalPenalty,
                'grand_total_payable' => $grandTotalDue + $grandTotalPenalty
            ]
        ]);
    }

    public function collectionReport(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = MonthlyCollection::with('member:id,member_name,member_code');

        if ($startDate && $endDate) {
            $query->whereBetween('collection_date', [$startDate, $endDate]);
        }

        $collections = $query->orderBy('collection_date', 'desc')->get();

        $totalCollected = $collections->sum('amount_collected');
        $totalPenalty = $collections->sum('penalty_collected');

        return response()->json([
            'collections' => $collections,
            'summary' => [
                'total_collected' => $totalCollected,
                'total_penalty_collected' => $totalPenalty,
                'total_revenue' => $totalCollected + $totalPenalty
            ]
        ]);
    }
}
