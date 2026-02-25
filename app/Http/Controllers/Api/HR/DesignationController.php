<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DesignationController extends Controller
{
    public function index()
    {
        $items = Designation::latest()->paginate(20);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'grade' => 'nullable|string|max:50',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item = Designation::create([
            'name' => $request->name,
            'grade' => $request->grade,
            'is_active' => $request->is_active ?? true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Designation created', 'data' => $item], 201);
    }

    public function show($id)
    {
        $item = Designation::find($id);
        if (!$item) return response()->json(['message' => 'Designation not found'], 404);
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        $item = Designation::find($id);
        if (!$item) return response()->json(['message' => 'Designation not found'], 404);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'grade' => 'nullable|string|max:50',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item->update([
            'name' => $request->name,
            'grade' => $request->grade,
            'is_active' => $request->is_active ?? $item->is_active,
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Designation updated', 'data' => $item]);
    }

    public function destroy($id)
    {
        $item = Designation::find($id);
        if (!$item) return response()->json(['message' => 'Designation not found'], 404);
        $item->delete();
        return response()->json(['message' => 'Designation deleted']);
    }
}
