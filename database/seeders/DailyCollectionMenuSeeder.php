<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class DailyCollectionMenuSeeder extends Seeder
{
    public function run(): void
    {
        $parent = Menu::where('slug', 'reports')->first();
        if (! $parent) {
            $this->command->warn('Reports parent menu not found. Run ReportMenuSeeder first.');
            return;
        }

        $child = Menu::updateOrCreate(
            ['slug' => 'daily-collection-sheet'],
            [
                'name'      => 'Daily Collection Sheet',
                'icon'      => 'ClipboardList',
                'order'     => 11,
                'parent_id' => $parent->id,
            ]
        );

        Permission::updateOrCreate(
            ['slug' => 'daily-collection-sheet.view'],
            [
                'name'    => 'Daily Collection Sheet View',
                'menu_id' => $child->id,
            ]
        );
    }
}
