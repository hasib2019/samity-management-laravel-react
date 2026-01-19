<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SamityProfile;
use App\Models\MemberInfo;
use App\Models\SavingsAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GlobalController extends Controller
{
    public function samities()
    {
        Log::info('GlobalController: Fetching samities');
        $samities = SamityProfile::all();
        Log::info('GlobalController: Found ' . $samities->count() . ' samities');
        return response()->json($samities);
    }

    public function members(Request $request)
    {
        $query = MemberInfo::query();
        if ($request->has('samity_id')) {
            $query->where('samity_id', $request->input('samity_id'));
        }
        $members = $query->orderBy('member_name')->get();
        return response()->json($members);
    }

    public function accounts($memberId)
    {
        $accounts = SavingsAccount::with('product')->where('member_id', $memberId)->get();
        return response()->json($accounts);
    }
}
