<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            [
                'name' => 'Dashboard',
                'slug' => 'dashboard',
                'icon' => 'layout-dashboard',
                'order' => 0,
            ],
            [
                'name' => 'User Management System',
                'slug' => 'user.management.system',
                'icon' => 'users',
                'order' => 1,
                'children' => [
                    ['name' => 'Users', 'slug' => 'users', 'icon' => 'user', 'order' => 1],
                    ['name' => 'Roles', 'slug' => 'roles', 'icon' => 'shield', 'order' => 2],
                    ['name' => 'Permissions', 'slug' => 'permissions', 'icon' => 'key', 'order' => 3],
                    ['name' => 'Menu Management', 'slug' => 'menu.management', 'icon' => 'layout', 'order' => 4],
                ]
            ],
            [
                'name' => 'Samity Profile',
                'slug' => 'samity-profile',
                'icon' => 'building',
                'order' => 3,
            ],
            [
                'name' => 'Member Profile',
                'slug' => 'member-profile',
                'icon' => 'user-check',
                'order' => 4,
            ]
        ];

        foreach ($menus as $menuData) {
            $children = $menuData['children'] ?? [];
            unset($menuData['children']);
            
            $parent = Menu::updateOrCreate(
                ['slug' => $menuData['slug']],
                $menuData
            );

            foreach ($children as $childData) {
                $childData['parent_id'] = $parent->id;
                Menu::updateOrCreate(
                    ['slug' => $childData['slug']],
                    $childData
                );
            }
        }
    }
}
