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
                    ['name' => 'GL Mapping Type', 'slug' => 'gl-mapping-type', 'icon' => 'git-commit', 'order' => 3],
                    ['name' => 'GL Mapping', 'slug' => 'gl-mapping', 'icon' => 'git-branch', 'order' => 4],
                    
                ]
            ],
            [
                'name' => 'Deposit/Withdraw',
                'slug' => 'deposit-withdraw',
                'icon' => 'wallet',
                'order' => 3,
                'children' => [
                    ['name' => 'Deposit Money', 'slug' => 'deposit-money', 'icon' => 'banknote', 'order' => 1],
                    ['name' => 'Deposit Request', 'slug' => 'deposit-request', 'icon' => 'file-text', 'order' => 2],
                    ['name' => 'Withdraw Money', 'slug' => 'withdraw-money', 'icon' => 'banknote', 'order' => 3],
                    ['name' => 'Withdraw Request', 'slug' => 'withdraw-request', 'icon' => 'file-text', 'order' => 4],
                ]
            ],
            [
                'name' => 'Voucher Posting',
                'slug' => 'voucher-posting',
                'icon' => 'file-text',
                'order' => 4,
                'children' => [
                    ['name' => 'Payment Voucher', 'slug' => 'payment-voucher', 'icon' => 'file-text', 'order' => 1],
                    ['name' => 'Receved Voucher', 'slug' => 'received-voucher', 'icon' => 'file-text', 'order' => 2],
                    ['name' => 'Contra Voucher', 'slug' => 'contra-voucher', 'icon' => 'file-text', 'order' => 3],
                    ['name' => 'Journal Voucher', 'slug' => 'journal-voucher', 'icon' => 'file-text', 'order' => 4],
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
