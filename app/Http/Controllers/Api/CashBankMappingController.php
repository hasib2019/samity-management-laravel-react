<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CashBankMapping;
use Illuminate\Support\Facades\Validator;

class CashBankMappingController extends Controller
{
    public function index(Request $request)
    {
        $query = CashBankMapping::with('type');

        if ($request->has('type_id')) {
            $query->where('type_id', $request->input('type_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type_id' => 'required|exists:types,id',
            'glac_id' => 'required|exists:glac_mst,id',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $mapping = CashBankMapping::create($request->all());

        return response()->json(['message' => 'Cash/Bank mapping created successfully', 'data' => $mapping], 201);
    }

    public function show($id)
    {
        $mapping = CashBankMapping::with('type')->find($id);

        if (!$mapping) {
            return response()->json(['message' => 'Mapping not found'], 404);
        }

        return response()->json($mapping);
    }

    public function update(Request $request, $id)
    {
        $mapping = CashBankMapping::find($id);

        if (!$mapping) {
            return response()->json(['message' => 'Mapping not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'type_id' => 'sometimes|exists:types,id',
            'glac_id' => 'sometimes|exists:glac_mst,id',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $mapping->update($request->all());

        return response()->json(['message' => 'Cash/Bank mapping updated successfully', 'data' => $mapping]);
    }

    public function destroy($id)
    {
        $mapping = CashBankMapping::find($id);

        if (!$mapping) {
            return response()->json(['message' => 'Mapping not found'], 404);
        }

        $mapping->delete();

        return response()->json(['message' => 'Cash/Bank mapping deleted successfully']);
    }
}

