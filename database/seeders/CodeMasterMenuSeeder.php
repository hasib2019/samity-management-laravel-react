<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class CodeMasterMenuSeeder extends Seeder
{
    public function run(): void
    {
        // Find 'Set up' menu
        $setupMenu = Menu::where('slug', 'setup')->first();

        if ($setupMenu) {
            // Create 'Code Master' menu
            $codeMasterMenu = Menu::updateOrCreate(
                ['slug' => 'code-master'],
                [
                    'name' => 'Code Master',
                    'icon' => 'Database', // Assuming 'Database' icon exists in lucide-react mapping
                    'order' => 5, // After GL Mapping (4)
                    'parent_id' => $setupMenu->id,
                ]
            );

            // Create Permissions
            $actions = ['view', 'create', 'edit', 'delete', 'sync'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'code.master.' . $action],
                    [
                        'name' => 'Code Master ' . ucfirst($action),
                        'menu_id' => $codeMasterMenu->id,
                    ]
                );
            }
        }
    }
}
