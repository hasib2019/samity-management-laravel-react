<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class GeneralSettingMenuSeeder extends Seeder
{
    public function run(): void
    {
        // Top-level "General Settings" placed directly above "Set up".
        // Setup is seeded at order 2, so we take order 2 and push Setup to 3.
        Menu::updateOrCreate(
            ['slug' => 'general-settings'],
            [
                'name' => 'General Settings',
                'icon' => 'Settings',
                'order' => 2,
                'parent_id' => null,
                'is_hidden' => false,
            ]
        );

        Menu::where('slug', 'setup')->update(['order' => 3]);
    }
}
