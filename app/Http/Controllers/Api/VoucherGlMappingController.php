<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VoucherGlMapping;
use Illuminate\Support\Facades\Validator;

class VoucherGlMappingController extends Controller
{
    public function index(Request $request)
    {
        $query = VoucherGlMapping::with('voucherType');

        if ($request->has('voucher_type_id')) {
            $query->where('voucher_type_id', $request->input('voucher_type_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'voucher_type_id' => 'required|exists:types,id',
            'debit_glac_id' => 'required|exists:glac_mst,id',
            'credit_glac_id' => 'required|exists:glac_mst,id',
            'naration' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $mapping = VoucherGlMapping::create($request->all());

        return response()->json(['message' => 'Voucher GL mapping created successfully', 'data' => $mapping], 201);
    }

    public function show($id)
    {
        $mapping = VoucherGlMapping::with('voucherType')->find($id);

        if (!$mapping) {
            return response()->json(['message' => 'Voucher GL mapping not found'], 404);
        }

        return response()->json($mapping);
    }

    public function update(Request $request, $id)
    {
        $mapping = VoucherGlMapping::find($id);

        if (!$mapping) {
            return response()->json(['message' => 'Voucher GL mapping not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'voucher_type_id' => 'sometimes|exists:types,id',
            'debit_glac_id' => 'sometimes|exists:glac_mst,id',
            'credit_glac_id' => 'sometimes|exists:glac_mst,id',
            'naration' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $mapping->update($request->all());

        return response()->json(['message' => 'Voucher GL mapping updated successfully', 'data' => $mapping]);
    }

    public function destroy($id)
    {
        $mapping = VoucherGlMapping::find($id);

        if (!$mapping) {
            return response()->json(['message' => 'Voucher GL mapping not found'], 404);
        }

        $mapping->delete();

        return response()->json(['message' => 'Voucher GL mapping deleted successfully']);
    }
}

