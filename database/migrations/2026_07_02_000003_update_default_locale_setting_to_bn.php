<?php

use App\Services\SettingsService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The system default locale flipped from 'en' to 'bn'. This only touches rows
     * still sitting at the old seeded default — an admin who already changed it
     * via General Settings is left alone.
     */
    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')
            ->where('key', 'locale')
            ->where('value', 'en')
            ->update(['value' => 'bn']);

        // SettingsService caches all settings forever — bust it so the new value
        // actually takes effect instead of serving the stale cached 'en'.
        app(SettingsService::class)->flush();
    }

    public function down(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }

        DB::table('settings')
            ->where('key', 'locale')
            ->where('value', 'bn')
            ->update(['value' => 'en']);

        app(SettingsService::class)->flush();
    }
};
