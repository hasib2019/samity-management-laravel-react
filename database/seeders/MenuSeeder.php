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
                'icon' => 'LayoutDashboard',
                'order' => 0,
            ],
            [
                'name' => 'UMS',
                'slug' => 'user.management-system',
                'icon' => 'Users',
                'order' => 1,
                'children' => [
                    ['name' => 'Users', 'slug' => 'users', 'icon' => 'User', 'order' => 1],
                    ['name' => 'Roles', 'slug' => 'roles', 'icon' => 'Shield', 'order' => 2],
                    ['name' => 'Permissions', 'slug' => 'permissions', 'icon' => 'Key', 'order' => 3],
                    ['name' => 'Menu Management', 'slug' => 'menu-management', 'icon' => 'Menu', 'order' => 4],
                ]
            ],
            [
                'name' => 'Samity Management',
                'slug' => 'samity-management',
                'icon' => 'Building',
                'order' => 1,
                'children' => [
                    ['name' => 'Samity Profile', 'slug' => 'samity-profile', 'icon' => 'Building2', 'order' => 1],
                    ['name' => 'Member Profile', 'slug' => 'member-profile', 'icon' => 'UserCheck', 'order' => 2],
                ]
            ],
            [
                'name' => 'Set up',
                'slug' => 'setup',
                'icon' => 'Settings',
                'order' => 2,
                'children' => [
                    ['name' => 'Product Setup', 'slug' => 'product-setup', 'icon' => 'Package', 'order' => 1],
                    ['name' => 'GL Setup', 'slug' => 'gl-setup', 'icon' => 'BookOpen', 'order' => 2],
                    ['name' => 'GL Mapping Type', 'slug' => 'gl-mapping-type', 'icon' => 'GitCommit', 'order' => 3],
                    ['name' => 'GL Mapping', 'slug' => 'gl-mapping', 'icon' => 'GitBranch', 'order' => 4],
                    ['name' => 'Code Master', 'slug' => 'code-master', 'icon' => 'Database', 'order' => 5],
                    
                ]
            ],
            [
                'name' => 'Deposit/Withdraw',
                'slug' => 'deposit-withdraw',
                'icon' => 'Wallet',
                'order' => 3,
                'children' => [
                    ['name' => 'Deposit Money', 'slug' => 'deposit-money', 'icon' => 'ArrowDownCircle', 'order' => 1],
                    ['name' => 'Deposit Request', 'slug' => 'deposit-request', 'icon' => 'FileInput', 'order' => 2],
                    ['name' => 'Withdraw Money', 'slug' => 'withdraw-money', 'icon' => 'ArrowUpCircle', 'order' => 3],
                    ['name' => 'Withdraw Request', 'slug' => 'withdraw-request', 'icon' => 'FileOutput', 'order' => 4],
                ]
            ],
            [
                'name' => 'Voucher Posting',
                'slug' => 'voucher-posting',
                'icon' => 'FileText',
                'order' => 4,
                'children' => [
                    ['name' => 'Payment Voucher', 'slug' => 'payment-voucher', 'icon' => 'Receipt', 'order' => 1],
                    ['name' => 'Receved Voucher', 'slug' => 'received-voucher', 'icon' => 'ScrollText', 'order' => 2],
                    ['name' => 'Contra Voucher', 'slug' => 'contra-voucher', 'icon' => 'ArrowRightLeft', 'order' => 3],
                    ['name' => 'Journal Voucher', 'slug' => 'journal-voucher', 'icon' => 'Book', 'order' => 4],
                ]
            ],
            [
                'name' => 'Loan Management',
                'slug' => 'loan-management',
                'icon' => 'Briefcase',
                'order' => 5,
                'children' => [
                    ['name' => 'Loan Application', 'slug' => 'loan-application', 'icon' => 'FilePlus', 'order' => 1],
                    ['name' => 'Loan Disbursement', 'slug' => 'loan-disbursement', 'icon' => 'HandCoins', 'order' => 2],
                    ['name' => 'Loan Repayment', 'slug' => 'loan-repayment', 'icon' => 'CreditCard', 'order' => 3],
                ]
            ],
            [
                'name' => 'DPS Management',
                'slug' => 'dps-management',
                'icon' => 'PiggyBank',
                'order' => 6,
                'children' => [
                    ['name' => 'DPS Account', 'slug' => 'dps-account', 'icon' => 'FilePlus', 'order' => 1],
                    ['name' => 'DPS Collection', 'slug' => 'dps-collection', 'icon' => 'HandCoins', 'order' => 2],
                    ['name' => 'DPS Closing', 'slug' => 'dps-closing', 'icon' => 'XCircle', 'order' => 3],
                    ['name' => 'DPS List', 'slug' => 'dps-list', 'icon' => 'List', 'order' => 4],
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
