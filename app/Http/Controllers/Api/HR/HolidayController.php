<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Holiday;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class HolidayController extends Controller
{
    public function index()
    {
        $items = Holiday::orderBy('date', 'desc')->paginate(20);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'title' => 'required|string|max:150',
            'branch_id' => 'nullable|integer',
            'is_recurring' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item = Holiday::create([
            'date' => $request->date,
            'title' => $request->title,
            'branch_id' => $request->branch_id,
            'is_recurring' => $request->is_recurring ?? false,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Holiday created', 'data' => $item], 201);
    }

    public function show($id)
    {
        $item = Holiday::find($id);
        if (!$item) return response()->json(['message' => 'Holiday not found'], 404);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = Holiday::find($id);
        if (!$item) return response()->json(['message' => 'Holiday not found'], 404);

        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'title' => 'required|string|max:150',
            'branch_id' => 'nullable|integer',
            'is_recurring' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item->update([
            'date' => $request->date,
            'title' => $request->title,
            'branch_id' => $request->branch_id,
            'is_recurring' => $request->is_recurring ?? $item->is_recurring,
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Holiday updated', 'data' => $item]);
    }

    public function destroy($id)
    {
        $item = Holiday::find($id);
        if (!$item) return response()->json(['message' => 'Holiday not found'], 404);
        $item->delete();
        return response()->json(['message' => 'Holiday deleted']);
    }
}
