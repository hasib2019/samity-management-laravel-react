<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class MemberBalanceReportMenuSeeder extends Seeder
{
    public function run(): void
    {
        $parent = Menu::where('slug', 'reports')->first();
        if (! $parent) {
            $this->command->warn('Reports parent menu not found. Run ReportMenuSeeder first.');
            return;
        }

        $child = Menu::updateOrCreate(
            ['slug' => 'member-balance-report'],
            [
                'name'      => 'Member Balance Report',
                'icon'      => 'Users',
                'order'     => 12,
                'parent_id' => $parent->id,
            ]
        );

        Permission::updateOrCreate(
            ['slug' => 'member-balance-report.view'],
            [
                'name'    => 'Member Balance Report View',
                'menu_id' => $child->id,
            ]
        );
    }
}
