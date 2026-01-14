<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Type;
use Illuminate\Support\Facades\Validator;

class TypeController extends Controller
{
    public function index(Request $request)
    {
        $query = Type::query();

        if ($request->has('type_for')) {
            $query->where('type_for', $request->input('type_for'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type_for' => 'required|string',
            'name' => 'required|string',
            'code' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type = Type::create($request->all());

        return response()->json(['message' => 'Type created successfully', 'data' => $type], 201);
    }

    public function show($id)
    {
        $type = Type::find($id);

        if (!$type) {
            return response()->json(['message' => 'Type not found'], 404);
        }

        return response()->json($type);
    }

    public function update(Request $request, $id)
    {
        $type = Type::find($id);

        if (!$type) {
            return response()->json(['message' => 'Type not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'type_for' => 'sometimes|string',
            'name' => 'sometimes|string',
            'code' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $type->update($request->all());

        return response()->json(['message' => 'Type updated successfully', 'data' => $type]);
    }

    public function destroy($id)
    {
        $type = Type::find($id);

        if (!$type) {
            return response()->json(['message' => 'Type not found'], 404);
        }

        $type->delete();

        return response()->json(['message' => 'Type deleted successfully']);
    }
}

