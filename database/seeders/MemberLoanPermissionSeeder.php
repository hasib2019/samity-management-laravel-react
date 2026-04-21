<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class MemberLoanPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissionMap = [
            'member-loan-application' => [
                'member.loan.application.view',
                'member.loan.application.create',
                'member.loan.application.edit',
                'member.loan.application.delete',
                'member.loan.application.approve',
                'member.loan.application.reject',
            ],
            'member-loan-disbursement' => [
                'member.loan.disbursement.view',
                'member.loan.disbursement.create',
            ],
            'member-loan-repayment' => [
                'member.loan.repayment.view',
                'member.loan.repayment.create',
            ],
            'member-loan-closing' => [
                'member.loan.closing.view',
                'member.loan.closing.create',
            ],
            'member-loan-accounts' => [
                'member.loan.account.view',
                'member.loan.balance.view',
                'member.loan.statement.view',
                'member.loan.transaction.view',
                'member.loan.accrual.run',
            ],
        ];

        foreach ($permissionMap as $menuSlug => $permissions) {
            $menu = Menu::where('slug', $menuSlug)->first();
            if (!$menu) {
                continue;
            }

            foreach ($permissions as $slug) {
                Permission::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => ucwords(str_replace('.', ' ', $slug)),
                        'menu_id' => $menu->id,
                    ]
                );
            }
        }
    }
}
