<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodeMaster;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
            $apiKey = config('services.external.key');
            $url = config('services.external.url');

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
                     Log::error('Code Master sync: invalid data format from external API', ['response' => $data]);
                     return response()->json(['message' => 'Invalid data format received from the external service.'], 502);
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
                Log::error('Code Master sync: external API failed', ['status' => $response->status(), 'body' => $response->body()]);
                return response()->json([
                    'message' => 'Failed to fetch data from the external service. Please try again later.',
                ], 502);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Code Master sync failed', ['exception' => $e->getMessage()]);
            return response()->json([
                'message' => 'Sync failed. Please contact support if the problem persists.',
            ], 500);
        }
    }
}
