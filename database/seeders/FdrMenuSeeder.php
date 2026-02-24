<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FdrMenuSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Menu
        $parentMenu = Menu::updateOrCreate(
            ['slug' => 'fdr-management'],
            [
                'name' => 'FDR Management',
                'icon' => 'Landmark', // Or 'Briefcase', 'PiggyBank'
                'order' => 7,
                'parent_id' => null,
                'is_hidden' => false,
            ]
        );

        $children = [
            ['name' => 'FDR Account', 'slug' => 'fdr-account', 'icon' => 'FilePlus', 'order' => 1],
            ['name' => 'FDR Closing', 'slug' => 'fdr-closing', 'icon' => 'XCircle', 'order' => 2],
            ['name' => 'FDR List', 'slug' => 'fdr-list', 'icon' => 'List', 'order' => 3],
        ];

        foreach ($children as $child) {
            Menu::updateOrCreate(
                ['slug' => $child['slug']],
                [
                    'name' => $child['name'],
                    'icon' => $child['icon'],
                    'order' => $child['order'],
                    'parent_id' => $parentMenu->id,
                    'is_hidden' => false,
                ]
            );
        }

        // Fetch menus for permission assignment
        $fdrAccountMenu = Menu::where('slug', 'fdr-account')->first();
        $fdrClosingMenu = Menu::where('slug', 'fdr-closing')->first();
        $fdrListMenu = Menu::where('slug', 'fdr-list')->first();

        // 2. Create Permissions
        $permissions = [
            // FDR Application
            ['name' => 'FDR Application View', 'slug' => 'fdr.application.view', 'menu_id' => $fdrAccountMenu->id],
            ['name' => 'FDR Application Create', 'slug' => 'fdr.application.create', 'menu_id' => $fdrAccountMenu->id],
            ['name' => 'FDR Application Edit', 'slug' => 'fdr.application.edit', 'menu_id' => $fdrAccountMenu->id],
            ['name' => 'FDR Application Delete', 'slug' => 'fdr.application.delete', 'menu_id' => $fdrAccountMenu->id],
            
            // FDR Closing
            ['name' => 'FDR Closing View', 'slug' => 'fdr.closing.view', 'menu_id' => $fdrClosingMenu->id],
            ['name' => 'FDR Closing Create', 'slug' => 'fdr.closing.create', 'menu_id' => $fdrClosingMenu->id],
            
            // FDR List
            ['name' => 'FDR List View', 'slug' => 'fdr.list.view', 'menu_id' => $fdrListMenu->id],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        // 3. Assign Permissions to Admin Role (Role ID 1)
        $roleId = 1;
        $permissionIds = Permission::whereIn('slug', array_column($permissions, 'slug'))->pluck('id');
        
        // Use DB table direct insert/sync to avoid Model issues if any, or just attach
        foreach ($permissionIds as $id) {
            DB::table('permission_role')->updateOrInsert(
                ['permission_id' => $id, 'role_id' => $roleId],
                ['permission_id' => $id, 'role_id' => $roleId]
            );
        }
    }
}
