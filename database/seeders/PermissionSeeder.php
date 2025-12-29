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
    }
}
