<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ShiftController extends Controller
{
    public function index()
    {
        $items = Shift::latest()->paginate(20);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'grace_minutes' => 'nullable|integer|min:0',
            'break_minutes' => 'nullable|integer|min:0',
            'weekly_off_pattern' => 'nullable|array',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item = Shift::create([
            'name' => $request->name,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'grace_minutes' => $request->grace_minutes ?? 0,
            'break_minutes' => $request->break_minutes ?? 0,
            'weekly_off_pattern' => $request->weekly_off_pattern,
            'is_active' => $request->is_active ?? true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Shift created', 'data' => $item], 201);
    }

    public function show($id)
    {
        $item = Shift::find($id);
        if (!$item) return response()->json(['message' => 'Shift not found'], 404);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = Shift::find($id);
        if (!$item) return response()->json(['message' => 'Shift not found'], 404);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'grace_minutes' => 'nullable|integer|min:0',
            'break_minutes' => 'nullable|integer|min:0',
            'weekly_off_pattern' => 'nullable|array',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item->update([
            'name' => $request->name,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'grace_minutes' => $request->grace_minutes ?? $item->grace_minutes,
            'break_minutes' => $request->break_minutes ?? $item->break_minutes,
            'weekly_off_pattern' => $request->weekly_off_pattern,
            'is_active' => $request->is_active ?? $item->is_active,
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Shift updated', 'data' => $item]);
    }

    public function destroy($id)
    {
        $item = Shift::find($id);
        if (!$item) return response()->json(['message' => 'Shift not found'], 404);
        $item->delete();
        return response()->json(['message' => 'Shift deleted']);
    }
}
