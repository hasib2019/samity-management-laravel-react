<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\GlAccountRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\GlAccount;

class GlAccountController extends Controller
{
    protected $repository;

    public function __construct(GlAccountRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    public function index(Request $request)
    {
        if (!Auth::user()->can('gl.setup.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($this->repository->get($request->all()));
    }

    public function store(Request $request)
    {
        if (!Auth::user()->can('gl.setup.create')) {
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
        if (!Auth::user()->can('gl.setup.view')) {
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
        if (!Auth::user()->can('gl.setup.edit')) {
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

    public function sync(Request $request)
    {
        if (!Auth::user()->can('gl.setup.sync')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'tableName' => 'required|string',
            'key' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $url = config('services.external.url');
            $apiKey = config('services.external.key');
            $response = Http::withHeaders([
                'api-key' => $apiKey
            ])->withBody(json_encode($request->all()), 'application/json')->get($url);
            
            if ($response->status() == 200) {
                $responseData = $response->json();
                
                if (isset($responseData['data']) && is_array($responseData['data'])) {
                    $count = 0;
                    foreach ($responseData['data'] as $item) {
                        $data = [
                            'id' => $item['id'],
                            'glac_code' => $item['glac_code'],
                            'glac_name' => $item['glac_name'],
                            'parent_child' => $item['parent_child'],
                            'parent_id' => $item['parent_id'] ??null,
                            'glac_type' =>  $item['glac_type'],
                            'level_code' => $item['level_code'] ?? null,
                            'gl_nature' => $item['gl_nature'],
                            'allow_manual_dr' => $item['allow_manual_dr'],
                            'allow_manual_cr' => $item['allow_manual_cr'],
                            'status' => 'A',
                            'is_default' => $item['is_default'] ?? false,
                            'doptor_id' => $item['doptor_id'] ?? 0,
                            'is_abonton' => $item['is_abonton'] ?? false,
                            'is_percentage' => $item['is_percentage'] ?? 0,
                            'is_carry_forward' => $item['is_carry_forward'] ?? false,
                            'is_income_expense' => $item['is_income_expense'] ?? false,
                            'created_by' => 1,
                            'updated_by' => 1,
                        ];

                        // Remove duplicates with same code but different ID
                        GlAccount::where('glac_code', $item['glac_code'])
                            ->where('id', '!=', $item['id'])
                            ->delete();

                        GlAccount::updateOrCreate(
                            ['id' => $item['id']],
                            $data
                        );
                        $count++;
                    }
                    return response()->json(['message' => 'সফলভাবে ডাটা প্রদান করা হয়েছে!', 'count' => $count]);
                } else {
                    return response()->json(['message' => 'No data found in response'], 404);
                }
            } else {
                Log::error('GL account sync: external API failed', ['status' => $response->status(), 'body' => $response->body()]);
                return response()->json(['message' => 'Failed to fetch data from the external service. Please try again later.'], 502);
            }
        } catch (\Exception $e) {
            Log::error('GL account sync failed', ['exception' => $e->getMessage()]);
            return response()->json(['message' => 'Sync failed. Please contact support if the problem persists.'], 500);
        }
    }

    public function destroy($id)
    {
        if (!Auth::user()->can('gl.setup.delete')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $this->repository->delete($id);

        return response()->json(['message' => 'GL Account deleted successfully']);
    }

    public function getTree()
    {
        if (!Auth::user()->can('gl.setup.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($this->repository->getTree());
    }
}
