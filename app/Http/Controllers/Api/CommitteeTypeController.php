<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommitteeType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CommitteeTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:committee.type.view')->only(['index', 'show']);
        $this->middleware('permission:committee.type.create')->only(['store']);
        $this->middleware('permission:committee.type.edit')->only(['update']);
        $this->middleware('permission:committee.type.delete')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $query = CommitteeType::query();

        if ($request->is_active !== null) {
            $query->where('is_active', $request->is_active);
        }

        $types = $query->latest()->paginate(20);
        return response()->json($types);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:committee_types',
            'name_bn' => 'required|string',
            'description' => 'nullable|string',
            'validity_period' => 'required|integer|min:1',
            'member_count_options' => 'required|array|min:1',
            'member_count_options.*' => 'integer|in:3,6,9,12',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $type = CommitteeType::create($request->only([
                'name', 'name_bn', 'description', 'validity_period', 'member_count_options'
            ]));

            return response()->json([
                'message' => 'Committee Type created successfully',
                'data' => $type
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $type = CommitteeType::find($id);

        if (!$type) {
            return response()->json(['message' => 'Committee Type not found'], 404);
        }

        return response()->json($type);
    }

    public function update(Request $request, $id)
    {
        $type = CommitteeType::find($id);

        if (!$type) {
            return response()->json(['message' => 'Committee Type not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:committee_types,name,' . $id,
            'name_bn' => 'required|string',
            'description' => 'nullable|string',
            'validity_period' => 'required|integer|min:1',
            'member_count_options' => 'required|array|min:1',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $type->update($request->only([
                'name', 'name_bn', 'description', 'validity_period', 'member_count_options', 'is_active'
            ]));

            return response()->json([
                'message' => 'Committee Type updated successfully',
                'data' => $type
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $type = CommitteeType::find($id);

        if (!$type) {
            return response()->json(['message' => 'Committee Type not found'], 404);
        }

        // Check if type is in use
        if ($type->committees()->exists()) {
            return response()->json(['message' => 'Cannot delete Committee Type with existing committees'], 400);
        }

        try {
            $type->delete();
            return response()->json(['message' => 'Committee Type deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getActive()
    {
        $types = CommitteeType::where('is_active', true)->select('id', 'name', 'name_bn', 'validity_period', 'member_count_options')->get();
        return response()->json($types);
    }
}
