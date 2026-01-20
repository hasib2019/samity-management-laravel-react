<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\GlMstMapping;

class GlMappingController extends Controller
{
    public function index(Request $request)
    {
        if (!Auth::user()->can('gl.mapping.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $query = GlMstMapping::with(['glAccount', 'mappingType'])->latest();
        if ($request->has('gl_code_type')) {
            $query->where('gl_code_type', $request->input('gl_code_type'));
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('gl.mapping.create')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'gl_code_type' => 'required|string|max:50|exists:gl_mst_type,type_code',
            'gl_mst_id' => 'required|exists:glac_mst,id',
            'status' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        $item = GlMstMapping::create($data);
        return response()->json(['message' => 'Created', 'data' => $item], 201);
    }

    public function show($id)
    {
        if (!Auth::user()->can('gl.mapping.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = GlMstMapping::with(['glAccount', 'mappingType'])->find($id);
        if (!$item) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->can('gl.mapping.edit')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = GlMstMapping::find($id);
        if (!$item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'gl_code_type' => 'sometimes|string|max:50|exists:gl_mst_type,type_code',
            'gl_mst_id' => 'sometimes|exists:glac_mst,id',
            'status' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['updated_by'] = Auth::id();

        $item->update($data);
        return response()->json(['message' => 'Updated', 'data' => $item]);
    }

    public function destroy($id)
    {
        if (!Auth::user()->can('gl.mapping.delete')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = GlMstMapping::find($id);
        if (!$item) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $item->update(['status' => false, 'updated_by' => Auth::id()]);
        return response()->json(['message' => 'Deleted']);
    }
}

