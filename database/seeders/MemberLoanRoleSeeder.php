<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class MemberLoanRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'member-loan-officer' => [
                'name' => 'Member Loan Officer',
                'permissions' => [
                    'member.loan.application.view',
                    'member.loan.application.create',
                    'member.loan.disbursement.view',
                    'member.loan.repayment.view',
                    'member.loan.repayment.create',
                    'member.loan.closing.view',
                    'member.loan.account.view',
                    'member.loan.balance.view',
                    'member.loan.statement.view',
                    'member.loan.transaction.view',
                ],
            ],
            'member-loan-manager' => [
                'name' => 'Member Loan Manager',
                'permissions' => [
                    'member.loan.application.view',
                    'member.loan.application.create',
                    'member.loan.application.edit',
                    'member.loan.application.approve',
                    'member.loan.application.reject',
                    'member.loan.disbursement.view',
                    'member.loan.disbursement.create',
                    'member.loan.repayment.view',
                    'member.loan.repayment.create',
                    'member.loan.closing.view',
                    'member.loan.closing.create',
                    'member.loan.account.view',
                    'member.loan.balance.view',
                    'member.loan.statement.view',
                    'member.loan.transaction.view',
                    'member.loan.accrual.run',
                ],
            ],
            'member-loan-admin' => [
                'name' => 'Member Loan Administrator',
                'permissions' => [
                    'member.loan.application.view',
                    'member.loan.application.create',
                    'member.loan.application.edit',
                    'member.loan.application.delete',
                    'member.loan.application.approve',
                    'member.loan.application.reject',
                    'member.loan.disbursement.view',
                    'member.loan.disbursement.create',
                    'member.loan.repayment.view',
                    'member.loan.repayment.create',
                    'member.loan.closing.view',
                    'member.loan.closing.create',
                    'member.loan.account.view',
                    'member.loan.balance.view',
                    'member.loan.statement.view',
                    'member.loan.transaction.view',
                    'member.loan.accrual.run',
                ],
            ],
        ];

        foreach ($roles as $slug => $config) {
            $role = Role::updateOrCreate(
                ['slug' => $slug],
                ['name' => $config['name'], 'slug' => $slug]
            );

            $permissions = Permission::whereIn('slug', $config['permissions'])->pluck('id');
            $role->permissions()->sync($permissions);
        }
    }
}
