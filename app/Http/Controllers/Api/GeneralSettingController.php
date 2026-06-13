<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GeneralSetting;
use App\Services\SettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class GeneralSettingController extends Controller
{
    /**
     * Return all settings grouped by section (site_identity, localization, ...).
     */
    public function index(SettingsService $settings)
    {
        if (! Auth::user()->can('general.settings.view')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['data' => $settings->groupedForApi()]);
    }

    /**
     * Bulk-update settings. Scalar values arrive under `settings[key]`;
     * logo/favicon arrive as uploaded files keyed by their setting key.
     */
    public function update(Request $request, SettingsService $settings)
    {
        if (! Auth::user()->can('general.settings.update')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'settings' => ['nullable', 'array'],
            'settings.contact_email' => ['nullable', 'email', 'max:255'],
            'settings.notification_from_email' => ['nullable', 'email', 'max:255'],
            'settings.fiscal_year_start_month' => ['nullable', 'integer', 'between:1,12'],
            'settings.default_penalty_late_date' => ['nullable', 'integer', 'between:1,31'],
            'settings.number_format_decimals' => ['nullable', 'integer', 'between:0,6'],
            'settings.default_monthly_subscription_fee' => ['nullable', 'numeric', 'min:0'],
            'settings.default_penalty_amount' => ['nullable', 'numeric', 'min:0'],
            'settings.default_member_admission_fee' => ['nullable', 'numeric', 'min:0'],
            'site_logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:2048'],
            'site_favicon' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,svg,webp,ico', 'max:1024'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Whitelist scalar settings to known keys only.
        $incoming = (array) $request->input('settings', []);
        $pairs = array_intersect_key($incoming, array_flip(GeneralSetting::scalarKeys()));

        // Handle file-backed settings (logo/favicon): store new, remove old.
        foreach (GeneralSetting::imageKeys() as $imageKey) {
            if ($request->hasFile($imageKey)) {
                $oldPath = $settings->get($imageKey);
                if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
                $pairs[$imageKey] = $request->file($imageKey)->store('settings', 'public');
            }
        }

        if (! empty($pairs)) {
            $settings->setMany($pairs, Auth::id());
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'data' => $settings->groupedForApi(),
        ]);
    }
}
