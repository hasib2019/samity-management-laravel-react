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
                'slug' => 'user.management-system',
                'icon' => 'users',
                'order' => 1,
                'children' => [
                    ['name' => 'Users', 'slug' => 'users', 'icon' => 'user', 'order' => 1],
                    ['name' => 'Roles', 'slug' => 'roles', 'icon' => 'shield', 'order' => 2],
                    ['name' => 'Permissions', 'slug' => 'permissions', 'icon' => 'key', 'order' => 3],
                    ['name' => 'Menu Management', 'slug' => 'menu-management', 'icon' => 'layout', 'order' => 4],
                ]
            ],
            [
                'name' => 'Samity Management',
                'slug' => 'samity-management',
                'icon' => 'building',
                'order' => 1,
                'children' => [
                    ['name' => 'Samity Profile', 'slug' => 'samity-profile', 'icon' => 'samity.profile', 'order' => 1],
                    ['name' => 'Member Profile', 'slug' => 'member-profile', 'icon' => 'member.profile', 'order' => 2],
                ]
            ],
            [
                'name' => 'Set up',
                'slug' => 'setup',
                'icon' => 'settings',
                'order' => 2,
                'children' => [
                    ['name' => 'Product Setup', 'slug' => 'product-setup', 'icon' => 'package', 'order' => 1],
                    ['name' => 'GL Setup', 'slug' => 'gl-setup', 'icon' => 'book-open', 'order' => 2],
                ]
            ],
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
