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

        // Type Setup Permissions
        $typeSetupMenu = Menu::where('slug', 'type-setup')->first();
        if ($typeSetupMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'type.setup.' . $action],
                    [
                        'name' => 'Type Setup ' . ucfirst($action),
                        'menu_id' => $typeSetupMenu->id,
                    ]
                );
            }
        }

        // Cash/Bank Mapping Permissions
        $cashBankMappingMenu = Menu::where('slug', 'cash-bank-mapping')->first();
        if ($cashBankMappingMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'cash.bank.mapping.' . $action],
                    [
                        'name' => 'Cash/Bank Mapping ' . ucfirst($action),
                        'menu_id' => $cashBankMappingMenu->id,
                    ]
                );
            }
        }

        // Voucher GL Mapping Permissions
        $voucherGlMappingMenu = Menu::where('slug', 'voucher-gl-mapping')->first();
        if ($voucherGlMappingMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'voucher.gl.mapping.' . $action],
                    [
                        'name' => 'Voucher GL Mapping ' . ucfirst($action),
                        'menu_id' => $voucherGlMappingMenu->id,
                    ]
                );
            }
        }

        // Deposit Money Permissions
        $depositMoneyMenu = Menu::where('slug', 'deposit-money')->first();
        if ($depositMoneyMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'deposit.money.' . $action],
                    [
                        'name' => 'Deposit Money ' . ucfirst($action),
                        'menu_id' => $depositMoneyMenu->id,
                    ]
                );
            }
        }

        // Deposit Request Permissions
        $depositRequestMenu = Menu::where('slug', 'deposit-request')->first();
        if ($depositRequestMenu) {
            $actions = ['view', 'create', 'edit', 'delete', 'approve', 'reject'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'deposit.request.' . $action],
                    [
                        'name' => 'Deposit Request ' . ucfirst($action),
                        'menu_id' => $depositRequestMenu->id,
                    ]
                );
            }
        }

        // Withdraw Money Permissions
        $withdrawMoneyMenu = Menu::where('slug', 'withdraw-money')->first();
        if ($withdrawMoneyMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'withdraw.money.' . $action],
                    [
                        'name' => 'Withdraw Money ' . ucfirst($action),
                        'menu_id' => $withdrawMoneyMenu->id,
                    ]
                );
            }
        }

        // Withdraw Request Permissions
        $withdrawRequestMenu = Menu::where('slug', 'withdraw-request')->first();
        if ($withdrawRequestMenu) {
            $actions = ['view', 'create', 'edit', 'delete', 'approve', 'reject'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'withdraw.request.' . $action],
                    [
                        'name' => 'Withdraw Request ' . ucfirst($action),
                        'menu_id' => $withdrawRequestMenu->id,
                    ]
                );
            }
        }

        // Voucher Request Permissions
        $voucherRequestMenu = Menu::where('slug', 'voucher-request')->first();
        if ($voucherRequestMenu) {
            $actions = ['view', 'create', 'edit', 'delete', 'approve', 'reject'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'voucher.request.' . $action],
                    [
                        'name' => 'Voucher Request ' . ucfirst($action),
                        'menu_id' => $voucherRequestMenu->id,
                    ]
                );
            }
        }
    }
}
