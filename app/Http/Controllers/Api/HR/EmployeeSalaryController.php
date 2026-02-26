<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\EmployeeSalary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class EmployeeSalaryController extends Controller
{
    public function index(Request $request)
    {
        $query = EmployeeSalary::with('employee');
        if ($request->filled('employee_id')) $query->where('employee_id', $request->employee_id);
        $items = $query->latest()->paginate(50);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:hr_employees,id',
            'base_salary' => 'required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item = EmployeeSalary::create([
            'employee_id' => $request->employee_id,
            'base_salary' => $request->base_salary,
            'effective_from' => $request->effective_from,
            'is_active' => $request->is_active ?? true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Employee salary saved', 'data' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        $item = EmployeeSalary::find($id);
        if (!$item) return response()->json(['message' => 'Employee salary not found'], 404);

        $validator = Validator::make($request->all(), [
            'base_salary' => 'required|numeric|min:0',
            'effective_from' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item->update([
            'base_salary' => $request->base_salary,
            'effective_from' => $request->effective_from ?? $item->effective_from,
            'is_active' => $request->is_active ?? $item->is_active,
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Employee salary updated', 'data' => $item]);
    }

    public function destroy($id)
    {
        $item = EmployeeSalary::find($id);
        if (!$item) return response()->json(['message' => 'Employee salary not found'], 404);
        $item->delete();
        return response()->json(['message' => 'Employee salary deleted']);
    }
}
