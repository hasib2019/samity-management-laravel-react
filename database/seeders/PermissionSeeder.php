<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissionsByMenu = [
            'users' => ['view', 'create', 'edit', 'delete'],
            'roles' => ['view', 'create', 'edit', 'delete'],
            'permissions' => ['view', 'create', 'edit', 'delete'],
            'menu-management' => ['view', 'create', 'edit', 'delete'],
        ];

        foreach ($permissionsByMenu as $menuSlug => $actions) {
            $menu = Menu::where('slug', $menuSlug)->first();
            if ($menu) {
                foreach ($actions as $action) {
                    Permission::updateOrCreate(
                        ['slug' => rtrim($menuSlug, 's') . '.' . $action],
                        [
                            'name' => ucfirst($menuSlug) . ' ' . ucfirst($action),
                            'menu_id' => $menu->id,
                        ]
                    );
                }
            }
        }
        
        // Add a dashboard view permission
        $dashboardMenu = Menu::where('slug', 'dashboard')->first();
        if ($dashboardMenu) {
            Permission::updateOrCreate(
                ['slug' => 'dashboard.view'],
                [
                    'name' => 'Dashboard View',
                    'menu_id' => $dashboardMenu->id,
                ]
            );
        }

        // Samity Profile Permissions
        $samityMenu = Menu::where('slug', 'samity-profile')->first();
        if ($samityMenu) {
            Permission::updateOrCreate(
                ['slug' => 'samity.profile.view'],
                [
                    'name' => 'Samity Profile View',
                    'menu_id' => $samityMenu->id,
                ]
            );
            Permission::updateOrCreate(
                ['slug' => 'samity.profile.add'],
                [
                    'name' => 'Samity Profile Add',
                    'menu_id' => $samityMenu->id,
                ]
            );
        }

        // Member Profile Permissions
        $memberMenu = Menu::where('slug', 'member-profile')->first();
        if ($memberMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'member.' . $action],
                    [
                        'name' => 'Member Profile ' . ucfirst($action),
                        'menu_id' => $memberMenu->id,
                    ]
                );
            }
        }

        // Product Setup Permissions
        $productSetupMenu = Menu::where('slug', 'product-setup')->first();
        if ($productSetupMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'product.setup.' . $action],
                    [
                        'name' => 'Product Setup ' . ucfirst($action),
                        'menu_id' => $productSetupMenu->id,
                    ]
                );
            }
        }

        // GL Setup Permissions
        $glSetupMenu = Menu::where('slug', 'gl-setup')->first();
        if ($glSetupMenu) {
            $actions = ['view', 'create', 'edit', 'delete', 'sync'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'gl.setup.' . $action],
                    [
                        'name' => 'GL Setup ' . ucfirst($action),
                        'menu_id' => $glSetupMenu->id,
                    ]
                );
            }
        }
    }
}
