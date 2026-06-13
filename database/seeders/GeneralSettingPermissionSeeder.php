<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class GeneralSettingPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $menu = Menu::where('slug', 'general-settings')->first();

        if (! $menu) {
            return;
        }

        foreach (['view', 'update'] as $action) {
            Permission::updateOrCreate(
                ['slug' => 'general.settings.' . $action],
                [
                    'name' => 'General Settings ' . ucfirst($action),
                    'menu_id' => $menu->id,
                ]
            );
        }
    }
}
