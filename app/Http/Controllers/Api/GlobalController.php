<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SamityProfile;
use App\Models\MemberInfo;
use App\Models\SavingsAccount;

class GlobalController extends Controller
{
    public function getSamityList()
    {
        $samities = SamityProfile::select('id', 'samity_name', 'samity_code')->get();
        return response()->json($samities);
    }

    public function getMemberList(Request $request)
    {
        $query = MemberInfo::select('id', 'member_name', 'member_code', 'samity_id');

        if ($request->has('samity_id')) {
            $query->where('samity_id', $request->samity_id);
        }

        $members = $query->get();
        return response()->json($members);
    }

    public function getMemberAccounts($memberId)
    {
        $accounts = SavingsAccount::with('product:id,product_name')
            ->where('member_id', $memberId)
            ->select('id', 'account_number', 'product_id', 'current_balance')
            ->get();
            
        return response()->json($accounts);
    }
}
