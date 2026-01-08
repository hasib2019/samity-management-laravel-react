<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\GlAccountRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class GlAccountController extends Controller
{
    protected $repository;

    public function __construct(GlAccountRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function index()
    {
        if (!Auth::user()->can('gl-setup.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($this->repository->all());
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('gl-setup.create')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'glac_code' => 'required|string|max:30|unique:glac_mst',
            'glac_name' => 'required|string|max:200',
            'parent_child' => 'required|string|in:P,C',
            'parent_id' => 'nullable|exists:glac_mst,id',
            'glac_type' => 'required|string|in:A,L,I,E',
            'gl_nature' => 'required|string|in:D,C',
            'status' => 'required|string|in:A,N',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['created_by'] = Auth::id();
        // Default doptor_id if not present
        if (!isset($data['doptor_id'])) {
            $data['doptor_id'] = 0;
        }

        $account = $this->repository->create($data);

        return response()->json(['message' => 'GL Account created successfully', 'data' => $account], 201);
    }

    public function show($id)
    {
        if (!Auth::user()->can('gl-setup.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $account = $this->repository->find($id);
        if (!$account) {
            return response()->json(['message' => 'GL Account not found'], 404);
        }

        return response()->json($account);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->can('gl-setup.edit')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'glac_code' => 'required|string|max:30|unique:glac_mst,glac_code,' . $id,
            'glac_name' => 'required|string|max:200',
            'parent_child' => 'required|string|in:P,C',
            'parent_id' => 'nullable|exists:glac_mst,id',
            'glac_type' => 'required|string|in:A,L,I,E',
            'gl_nature' => 'required|string|in:D,C',
            'status' => 'required|string|in:A,N',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['updated_by'] = Auth::id();

        $account = $this->repository->update($id, $data);

        return response()->json(['message' => 'GL Account updated successfully', 'data' => $account]);
    }

    public function destroy($id)
    {
        if (!Auth::user()->can('gl-setup.delete')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $this->repository->delete($id);

        return response()->json(['message' => 'GL Account deleted successfully']);
    }

    public function getTree()
    {
        if (!Auth::user()->can('gl-setup.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($this->repository->getTree());
    }
}
