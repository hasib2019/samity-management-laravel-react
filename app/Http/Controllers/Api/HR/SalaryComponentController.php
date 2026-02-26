<?php

namespace App\Http\Controllers\Api\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\SalaryComponent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SalaryComponentController extends Controller
{
    public function index()
    {
        $items = SalaryComponent::latest()->paginate(50);
        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'code' => 'required|string|max:50|unique:hr_salary_components,code',
            'type' => 'required|in:basic,earning,deduction',
            'amount_type' => 'required|in:fixed,percent',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item = SalaryComponent::create([
            'name' => $request->name,
            'code' => $request->code,
            'type' => $request->type,
            'amount_type' => $request->amount_type,
            'amount' => $request->amount,
            'is_active' => $request->is_active ?? true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Component created', 'data' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        $item = SalaryComponent::find($id);
        if (!$item) return response()->json(['message' => 'Component not found'], 404);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'code' => 'required|string|max:50|unique:hr_salary_components,code,' . $id,
            'type' => 'required|in:basic,earning,deduction',
            'amount_type' => 'required|in:fixed,percent',
            'amount' => 'required|numeric|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $item->update([
            'name' => $request->name,
            'code' => $request->code,
            'type' => $request->type,
            'amount_type' => $request->amount_type,
            'amount' => $request->amount,
            'is_active' => $request->is_active ?? $item->is_active,
            'updated_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Component updated', 'data' => $item]);
    }

    public function destroy($id)
    {
        $item = SalaryComponent::find($id);
        if (!$item) return response()->json(['message' => 'Component not found'], 404);
        $item->delete();
        return response()->json(['message' => 'Component deleted']);
    }
}
