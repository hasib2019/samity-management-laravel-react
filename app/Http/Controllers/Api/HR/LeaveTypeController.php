<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\LeaveType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LeaveTypeController extends Controller
{
    public function index()
    {
        $items = LeaveType::latest()->paginate(50);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'max_days_per_year' => 'nullable|integer|min:0',
            'is_paid' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item = LeaveType::create([
            'name' => $request->name,
            'max_days_per_year' => $request->max_days_per_year ?? 0,
            'is_paid' => $request->is_paid ?? true,
            'is_active' => $request->is_active ?? true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Leave type created', 'data' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        $item = LeaveType::find($id);
        if (!$item) return response()->json(['message' => 'Leave type not found'], 404);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'max_days_per_year' => 'nullable|integer|min:0',
            'is_paid' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item->update([
            'name' => $request->name,
            'max_days_per_year' => $request->max_days_per_year ?? $item->max_days_per_year,
            'is_paid' => $request->is_paid ?? $item->is_paid,
            'is_active' => $request->is_active ?? $item->is_active,
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Leave type updated', 'data' => $item]);
    }

    public function destroy($id)
    {
        $item = LeaveType::find($id);
        if (!$item) return response()->json(['message' => 'Leave type not found'], 404);
        $item->delete();
        return response()->json(['message' => 'Leave type deleted']);
    }
}
