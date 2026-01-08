<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonthlyCollection;
use App\Models\CollectionSchedule;
use App\Models\MemberInfo;
use App\Models\SamityProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MonthlyCollectionController extends Controller
{
    public function getDues($memberId)
    {
        $member = MemberInfo::findOrFail($memberId);
        $samity = SamityProfile::first();

        if (!$samity) {
            return response()->json(['message' => 'Samity Profile not configured'], 400);
        }

        $monthlyFee = $samity->monthly_subscription_fee;
        $penaltyAmount = $samity->penalty_amount;
        $cutoffDay = $samity->penalty_late_date;

        $startDate = Carbon::parse($member->member_admission_date)->startOfMonth();
        $currentDate = Carbon::now();
        
        $paidRecords = MonthlyCollection::where('member_id', $memberId)
            ->get()
            ->keyBy(function ($item) {
                return $item->year . '-' . str_pad($item->month, 2, '0', STR_PAD_LEFT);
            });

        // Get Schedules for penalty dates
        $schedules = CollectionSchedule::all()
            ->keyBy(function ($item) {
                return $item->year . '-' . $item->month;
            });

        $dues = [];
        $totalDue = 0;
        $totalPenalty = 0;

        $iterator = $startDate->copy();
        
        // Safety break to prevent infinite loop if date is weird
        $limit = 0;
        while ($iterator->lte($currentDate->endOfMonth()) && $limit < 1200) { // 100 years max
            $key = $iterator->format('Y-m');
            $scheduleKey = $iterator->year . '-' . $iterator->month;
            $schedule = $schedules[$scheduleKey] ?? null;
            
            if (!isset($paidRecords[$key])) {
                $isLate = false;
                
                // Determine penalty start date
                if ($schedule) {
                    $penaltyStartDate = Carbon::parse($schedule->penalty_start_date);
                } else {
                    // Default logic: 15th (or configured day) of that month
                    $penaltyStartDate = Carbon::createFromDate($iterator->year, $iterator->month, $cutoffDay);
                }

                if ($currentDate->gt($penaltyStartDate)) {
                    $isLate = true;
                }

                $penalty = $isLate ? $penaltyAmount : 0;
                
                $dues[] = [
                    'month' => $iterator->month,
                    'year' => $iterator->year,
                    'month_name' => $iterator->format('F Y'),
                    'amount_due' => $monthlyFee,
                    'penalty_due' => $penalty,
                    'total_due' => $monthlyFee + $penalty,
                    'is_late' => $isLate,
                    'penalty_start_date' => $penaltyStartDate->format('Y-m-d')
                ];

                $totalDue += $monthlyFee;
                $totalPenalty += $penalty;
            }

            $iterator->addMonth();
            $limit++;
        }

        return response()->json([
            'member' => $member,
            'dues' => $dues,
            'summary' => [
                'total_basic_due' => $totalDue,
                'total_penalty_due' => $totalPenalty,
                'total_payable' => $totalDue + $totalPenalty
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'member_id' => 'required|exists:member_infos,id',
            'payments' => 'required|array',
            'payments.*.month' => 'required|integer|between:1,12',
            'payments.*.year' => 'required|integer',
            'payments.*.amount' => 'required|numeric',
            'payments.*.penalty' => 'required|numeric',
        ]);

        try {
            DB::beginTransaction();

            foreach ($request->payments as $payment) {
                $exists = MonthlyCollection::where('member_id', $request->member_id)
                    ->where('month', $payment['month'])
                    ->where('year', $payment['year'])
                    ->exists();

                if ($exists) {
                    continue; 
                }

                MonthlyCollection::create([
                    'member_id' => $request->member_id,
                    'month' => $payment['month'],
                    'year' => $payment['year'],
                    'amount_collected' => $payment['amount'],
                    'penalty_collected' => $payment['penalty'],
                    'collection_date' => Carbon::now(),
                    'collected_by' => Auth::id(),
                    'note' => $request->note ?? null,
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Collections saved successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save collections: ' . $e->getMessage()], 500);
        }
    }
    
    public function history($memberId)
    {
         $history = MonthlyCollection::where('member_id', $memberId)
            ->with('collectedBy')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'month_name' => Carbon::createFromDate($item->year, $item->month, 1)->format('F Y'),
                    'amount_collected' => $item->amount_collected,
                    'penalty_collected' => $item->penalty_collected,
                    'total_paid' => $item->amount_collected + $item->penalty_collected,
                    'collection_date' => $item->collection_date->format('Y-m-d'),
                    'collected_by' => $item->collectedBy->name ?? 'N/A'
                ];
            });

        return response()->json($history);
    }

    public function myDues(Request $request)
    {
        $user = Auth::user();
        $member = MemberInfo::where('user_id', $user->id)->first();

        if (!$member) {
            return response()->json(['message' => 'No member profile associated with this user.'], 404);
        }

        return $this->getDues($member->id);
    }

    public function myHistory(Request $request)
    {
        $user = Auth::user();
        $member = MemberInfo::where('user_id', $user->id)->first();

        if (!$member) {
            return response()->json(['message' => 'No member profile associated with this user.'], 404);
        }

        return $this->history($member->id);
    }
}
