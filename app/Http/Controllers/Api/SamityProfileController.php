<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SamityProfile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SamityProfileController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        if (!Auth::user()->can('samity-profile.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $samityProfile = SamityProfile::with(['creator', 'updator'])->first();
        return response()->json($samityProfile);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!Auth::user()->can('samity.profile.add')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (SamityProfile::exists()) {
            return response()->json(['message' => 'Samity Profile already exists. You can only update it.'], 400);
        }

        $validator = Validator::make($request->all(), [
            'samity_name' => 'required|string|max:255',
            'samity_code' => 'required|string|max:50|unique:samity_profiles',
            'samity_address' => 'required|string',
            'samity_type' => 'nullable|string|max:10',
            'monthly_subscription_fee' => 'nullable|numeric',
            'penalty_amount' => 'nullable|numeric',
            'penalty_late_date' => 'nullable|integer|between:1,31',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $samityProfile = SamityProfile::create([
            'samity_name' => $request->samity_name,
            'samity_code' => $request->samity_code,
            'samity_address' => $request->samity_address,
            'samity_type' => $request->samity_type ?? 'P',
            'monthly_subscription_fee' => $request->monthly_subscription_fee ?? 1000,
            'penalty_amount' => $request->penalty_amount ?? 200,
            'penalty_late_date' => $request->penalty_late_date ?? 15,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Samity Profile created successfully', 'data' => $samityProfile], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        if (!Auth::user()->can('samity-profile.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $samityProfile = SamityProfile::with(['creator', 'updator'])->find($id);

        if (!$samityProfile) {
            return response()->json(['message' => 'Samity Profile not found'], 404);
        }

        return response()->json($samityProfile);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        if (!Auth::user()->can('samity.profile.add')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $samityProfile = SamityProfile::find($id);

        if (!$samityProfile) {
            return response()->json(['message' => 'Samity Profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'samity_name' => 'required|string|max:255',
            'samity_code' => 'required|string|max:50|unique:samity_profiles,samity_code,' . $id,
            'samity_address' => 'required|string',
            'samity_type' => 'nullable|string|max:10',
            'monthly_subscription_fee' => 'nullable|numeric',
            'penalty_amount' => 'nullable|numeric',
            'penalty_late_date' => 'nullable|integer|between:1,31',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $samityProfile->update([
            'samity_name' => $request->samity_name,
            'samity_code' => $request->samity_code,
            'samity_address' => $request->samity_address,
            'samity_type' => $request->samity_type ?? 'P',
            'monthly_subscription_fee' => $request->monthly_subscription_fee,
            'penalty_amount' => $request->penalty_amount,
            'penalty_late_date' => $request->penalty_late_date,
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Samity Profile updated successfully', 'data' => $samityProfile]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        // Implementation skipped as not explicitly requested
    }
}
