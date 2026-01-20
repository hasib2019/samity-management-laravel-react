<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GlMappingType;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class GlMappingTypeController extends Controller
{
    public function index()
    {
        if (!Auth::user()->can('gl.mapping.type.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $items = GlMappingType::latest()->get();
        return response()->json($items);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('gl.mapping.type.create')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:150',
            'type_code' => 'required|string|max:50|unique:gl_mst_type,type_code',
            'description' => 'nullable|string',
            'status' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['type_code'] = $this->normalizeCode($data['type_code']);
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        $item = GlMappingType::create($data);
        return response()->json(['message' => 'Created', 'data' => $item], 201);
    }

    public function show($id)
    {
        if (!Auth::user()->can('gl.mapping.type.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = GlMappingType::find($id);
        if (!$item) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($item);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->can('gl.mapping.type.edit')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = GlMappingType::find($id);
        if (!$item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:150',
            'type_code' => 'sometimes|string|max:50|unique:gl_mst_type,type_code,' . $id,
            'description' => 'nullable|string',
            'status' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        if (isset($data['type_code'])) {
            $data['type_code'] = $this->normalizeCode($data['type_code']);
        }
        $data['updated_by'] = Auth::id();

        $item->update($data);
        return response()->json(['message' => 'Updated', 'data' => $item]);
    }

    public function destroy($id)
    {
        if (!Auth::user()->can('gl.mapping.type.delete')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $item = GlMappingType::find($id);
        if (!$item) {
            return response()->json(['message' => 'Not found'], 404);
        }
        $item->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function normalizeCode(string $code): string
    {
        $c = strtoupper($code);
        $c = preg_replace('/\s+/', '_', $c);
        $c = preg_replace('/[^A-Z0-9_]/', '', $c);
        return $c;
    }
}
