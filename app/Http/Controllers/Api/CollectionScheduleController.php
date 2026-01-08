<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CollectionSchedule;
use App\Models\SamityProfile;
use App\Models\MonthlyCollection;
use App\Models\MemberInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CollectionScheduleController extends Controller
{
    public function index()
    {
        $schedules = CollectionSchedule::with('creator')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();
        return response()->json($schedules);
    }

    public function store(Request $request)
    {
        $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer',
            'note' => 'nullable|string'
        ]);

        $samity = SamityProfile::first();
        if (!$samity) {
            return response()->json(['message' => 'Samity Profile not configured'], 400);
        }

        // Calculate penalty date (e.g., 15th of the month)
        // If the schedule is for a future/current month, it's 15th of that month.
        $scheduleDate = Carbon::createFromDate($request->year, $request->month, 1);
        $penaltyDate = $scheduleDate->copy()->day($samity->penalty_late_date);

        DB::beginTransaction();
        try {
            // Deactivate all other schedules if "Only one active" rule applies
            // The requirement says: "That month status true, other months status false"
            CollectionSchedule::query()->update(['is_active' => false]);

            $schedule = CollectionSchedule::updateOrCreate(
                [
                    'month' => $request->month,
                    'year' => $request->year
                ],
                [
                    'is_active' => true,
                    'penalty_start_date' => $penaltyDate,
                    'note' => $request->note,
                    'created_by' => Auth::id()
                ]
            );

            DB::commit();
            return response()->json(['message' => 'Schedule activated successfully', 'schedule' => $schedule]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to activate schedule: ' . $e->getMessage()], 500);
        }
    }

    public function reviewData(Request $request)
    {
        // "Review 1 year data"
        // Return summary of last 12 months for all active members
        
        $activeMembers = MemberInfo::where('status', 1)->count();
        $endDate = Carbon::now();
        $startDate = Carbon::now()->subYear();

        // Count collections in last year
        $collections = MonthlyCollection::whereBetween('collection_date', [$startDate, $endDate])->count();
        $totalCollected = MonthlyCollection::whereBetween('collection_date', [$startDate, $endDate])->sum('amount_collected');

        return response()->json([
            'active_members' => $activeMembers,
            'last_year_collections_count' => $collections,
            'last_year_total_amount' => $totalCollected,
            'review_period' => $startDate->format('M Y') . ' - ' . $endDate->format('M Y')
        ]);
    }
}
