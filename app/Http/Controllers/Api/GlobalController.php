<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SamityProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GlobalController extends Controller
{
    /**
     * Get all samities for global use (dropdowns, etc.)
     * This API is protected by auth:sanctum but requires no specific permission.
     */
    public function samities()
    {
        Log::info('GlobalController: Fetching samities');
        $samities = SamityProfile::all();
        Log::info('GlobalController: Found ' . $samities->count() . ' samities');
        return response()->json($samities);
    }
}
