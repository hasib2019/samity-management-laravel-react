<?php

namespace Database\Seeders;

use App\Models\GeneralSetting;
use Illuminate\Database\Seeder;

class GeneralSettingSeeder extends Seeder
{
    public function run(): void
    {
        foreach (GeneralSetting::definitions() as $def) {
            GeneralSetting::firstOrCreate(
                ['key' => $def['key']],
                [
                    'value' => $def['default'],
                    'group' => $def['group'],
                    'type' => $def['type'],
                    'autoload' => true,
                ]
            );
        }
    }
}
