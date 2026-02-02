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
                'is_active' => true,
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
                    'is_active' => true,
                ]
            );
        }

        // 2. Create Permissions
        $permissions = [
            // FDR Application
            ['name' => 'fdr.application.view', 'slug' => 'fdr.application.view', 'group_name' => 'FDR Application'],
            ['name' => 'fdr.application.create', 'slug' => 'fdr.application.create', 'group_name' => 'FDR Application'],
            ['name' => 'fdr.application.edit', 'slug' => 'fdr.application.edit', 'group_name' => 'FDR Application'],
            ['name' => 'fdr.application.delete', 'slug' => 'fdr.application.delete', 'group_name' => 'FDR Application'],
            
            // FDR Closing
            ['name' => 'fdr.closing.view', 'slug' => 'fdr.closing.view', 'group_name' => 'FDR Closing'],
            ['name' => 'fdr.closing.create', 'slug' => 'fdr.closing.create', 'group_name' => 'FDR Closing'],
            
            // FDR List
            ['name' => 'fdr.list.view', 'slug' => 'fdr.list.view', 'group_name' => 'FDR List'],
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
