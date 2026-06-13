<?php

namespace App\Services;

use App\Models\GeneralSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class SettingsService
{
    public const CACHE_KEY = 'settings.all';

    /**
     * All settings (cached). Returns a collection of GeneralSetting models.
     */
    public function all()
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return GeneralSetting::all();
        });
    }

    /**
     * Get a single setting's raw, type-cast value (image keys return the stored
     * relative path, NOT a URL — use groupedForApi() for display URLs).
     */
    public function get(string $key, $default = null)
    {
        $setting = $this->all()->firstWhere('key', $key);

        if (! $setting) {
            return $default;
        }

        $value = $this->castValue($setting->value, $setting->type);

        return $value === null ? $default : $value;
    }

    /**
     * Settings grouped by their `group`, with values prepared for the API
     * (booleans/numbers cast, image keys exposed as public URLs).
     */
    public function groupedForApi(): array
    {
        $grouped = [];

        foreach ($this->all() as $setting) {
            $grouped[$setting->group][] = [
                'key' => $setting->key,
                'value' => $this->presentValue($setting->value, $setting->type),
                'type' => $setting->type,
                'group' => $setting->group,
            ];
        }

        return $grouped;
    }

    /**
     * Upsert many settings at once, then bust the cache.
     *
     * @param  array<string, mixed>  $pairs  key => value
     */
    public function setMany(array $pairs, ?int $userId = null): void
    {
        foreach ($pairs as $key => $value) {
            GeneralSetting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => is_bool($value) ? ($value ? '1' : '0') : $value,
                    'updated_by' => $userId,
                ]
            );
        }

        $this->flush();
    }

    public function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    protected function castValue($value, string $type)
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean' => in_array((string) $value, ['1', 'true', 'on'], true),
            'integer' => (int) $value,
            'number' => (float) $value,
            default => $value,
        };
    }

    protected function presentValue($value, string $type)
    {
        if ($type === 'image') {
            return $value ? Storage::url($value) : null;
        }

        return $this->castValue($value, $type);
    }
}
