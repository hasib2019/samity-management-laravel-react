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
        
        // GL Mapping Permissions
        $glMappingMenu = Menu::where('slug', 'gl-mapping')->first();
        if ($glMappingMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'gl.mapping.' . $action],
                    [
                        'name' => 'GL Mapping ' . ucfirst($action),
                        'menu_id' => $glMappingMenu->id,
                    ]
                );
            }
        }

        // GL Mapping Type Permissions
        $glMappingTypeMenu = Menu::where('slug', 'gl-mapping-type')->first();
        if ($glMappingTypeMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'gl.mapping.type.' . $action],
                    [
                        'name' => 'GL Mapping Type ' . ucfirst($action),
                        'menu_id' => $glMappingTypeMenu->id,
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

        $paymentVoucherMenu = Menu::where('slug', 'payment-voucher')->first();
        if ($paymentVoucherMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'voucher.payment.' . $action],
                    [
                        'name' => 'Payment Voucher ' . ucfirst($action),
                        'menu_id' => $paymentVoucherMenu->id,
                    ]
                );
            }
        }

        $receivedVoucherMenu = Menu::where('slug', 'received-voucher')->first();
        if ($receivedVoucherMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'voucher.received.' . $action],
                    [
                        'name' => 'Receved Voucher ' . ucfirst($action),
                        'menu_id' => $receivedVoucherMenu->id,
                    ]
                );
            }
        }

        $contraVoucherMenu = Menu::where('slug', 'contra-voucher')->first();
        if ($contraVoucherMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'voucher.contra.' . $action],
                    [
                        'name' => 'Contra Voucher ' . ucfirst($action),
                        'menu_id' => $contraVoucherMenu->id,
                    ]
                );
            }
        }

        $journalVoucherMenu = Menu::where('slug', 'journal-voucher')->first();
        if ($journalVoucherMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'voucher.journal.' . $action],
                    [
                        'name' => 'Journal Voucher ' . ucfirst($action),
                        'menu_id' => $journalVoucherMenu->id,
                    ]
                );
            }
        }

        $loanApplicationMenu = Menu::where('slug', 'loan-application')->first();
        if ($loanApplicationMenu) {
            $actions = ['view', 'create', 'edit', 'delete', 'approve', 'reject'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'loan.application.' . $action],
                    [
                        'name' => 'Loan Application ' . ucfirst($action),
                        'menu_id' => $loanApplicationMenu->id,
                    ]
                );
            }
        }

        $loanRepaymentMenu = Menu::where('slug', 'loan-repayment')->first();
        if ($loanRepaymentMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'loan.repayment.' . $action],
                    [
                        'name' => 'Loan Repayment ' . ucfirst($action),
                        'menu_id' => $loanRepaymentMenu->id,
                    ]
                );
            }
        }

        $loanDisbursementMenu = Menu::where('slug', 'loan-disbursement')->first();
        if ($loanDisbursementMenu) {
            $actions = ['view', 'create', 'edit', 'delete'];
            foreach ($actions as $action) {
                Permission::updateOrCreate(
                    ['slug' => 'loan.disbursement.' . $action],
                    [
                        'name' => 'Loan Disbursement ' . ucfirst($action),
                        'menu_id' => $loanDisbursementMenu->id,
                    ]
                );
            }
        }
    }
}
