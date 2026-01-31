<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodeMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class CodeMasterController extends Controller
{
    public function index(Request $request)
    {
        $query = CodeMaster::query();

        if ($request->has('code_type')) {
            $query->where('code_type', 'like', '%' . $request->code_type . '%');
        }
        
        if ($request->has('display_value')) {
            $query->where('display_value', 'like', '%' . $request->display_value . '%');
        }

        $perPage = $request->get('per_page', 10);
        $codeMasters = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($codeMasters);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code_type' => 'required|string|max:255',
            'return_value' => 'required|string|max:255',
            'display_value' => 'required|string|max:255',
            'is_active' => 'boolean',
            'display_serial' => 'nullable|integer',
        ]);

        $validated['created_by'] = auth()->user()->name ?? 'system';
        
        $codeMaster = CodeMaster::create($validated);

        return response()->json([
            'message' => 'Code Master created successfully',
            'data' => $codeMaster
        ], 201);
    }

    public function show(CodeMaster $codeMaster)
    {
        return response()->json($codeMaster);
    }

    public function update(Request $request, CodeMaster $codeMaster)
    {
        $validated = $request->validate([
            'code_type' => 'required|string|max:255',
            'return_value' => 'required|string|max:255',
            'display_value' => 'required|string|max:255',
            'is_active' => 'boolean',
            'display_serial' => 'nullable|integer',
        ]);

        $validated['updated_by'] = auth()->user()->name ?? 'system';

        $codeMaster->update($validated);

        return response()->json([
            'message' => 'Code Master updated successfully',
            'data' => $codeMaster
        ]);
    }

    public function destroy(CodeMaster $codeMaster)
    {
        $codeMaster->delete();

        return response()->json([
            'message' => 'Code Master deleted successfully'
        ]);
    }

    public function sync()
    {
        // Permission check
        if (!auth()->user()->can('code.master.sync')) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $apiKey = env('EXTERNAL_API_KEY');
            $url = 'https://loan-api.rdcd.gov.bd/external/transaction/table-data';

            $body = [
                'tableName' => 'master.code_master',
                'key' => ['*']
            ];

            // Use GET with body and API Key header, similar to GlAccountController
            $response = Http::withHeaders([
                'api-key' => $apiKey
            ])->withBody(json_encode($body), 'application/json')->get($url);

            if ($response->successful()) {
                $data = $response->json();
                $items = $data['data'] ?? $data; 

                if (!is_array($items)) {
                     return response()->json(['message' => 'Invalid data format from external API', 'response' => $data], 500);
                }

                $count = 0;
                DB::beginTransaction();
                foreach ($items as $item) {
                    CodeMaster::updateOrCreate(
                        [
                            'code_type' => $item['code_type'],
                            'return_value' => $item['return_value']
                        ],
                        [
                            'display_value' => $item['display_value'] ?? '',
                            'is_active' => $item['is_active'] ?? true,
                            'display_serial' => $item['display_serial'] ?? null,
                            'created_by' => $item['created_by'] ?? 'sync',
                            'updated_by' => $item['updated_by'] ?? null,
                        ]
                    );
                    $count++;
                }
                DB::commit();

                return response()->json([
                    'message' => "Synced $count records successfully",
                ]);
            } else {
                return response()->json([
                    'message' => 'Failed to fetch data from external API',
                    'status' => $response->status(),
                    'body' => $response->body()
                ], 500);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Sync failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
