<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::latest()->paginate(20);
        return response()->json($departments);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'code' => 'required|string|max:50|unique:hr_departments,code',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $dep = Department::create([
            'name' => $request->name,
            'code' => $request->code,
            'is_active' => $request->is_active ?? true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Department created', 'data' => $dep], 201);
    }

    public function show($id)
    {
        $dep = Department::find($id);
        if (!$dep) {
            return response()->json(['message' => 'Department not found'], 404);
        }
        return response()->json($dep);
    }

    public function update(Request $request, $id)
    {
        $dep = Department::find($id);
        if (!$dep) {
            return response()->json(['message' => 'Department not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'code' => 'required|string|max:50|unique:hr_departments,code,' . $id,
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $dep->update([
            'name' => $request->name,
            'code' => $request->code,
            'is_active' => $request->is_active ?? $dep->is_active,
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Department updated', 'data' => $dep]);
    }

    public function destroy($id)
    {
        $dep = Department::find($id);
        if (!$dep) {
            return response()->json(['message' => 'Department not found'], 404);
        }
        $dep->delete();
        return response()->json(['message' => 'Department deleted']);
    }
}
