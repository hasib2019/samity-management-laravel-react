<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class MemberLoanMenuSeeder extends Seeder
{
    public function run(): void
    {
        $parent = Menu::firstOrCreate(
            ['slug' => 'member-loan-management'],
            [
                'name' => 'Member Loan',
                'icon' => 'Briefcase',
                'order' => 9,
                'parent_id' => null,
                'is_hidden' => false,
            ]
        );

        $children = [
            ['name' => 'Loan Application', 'slug' => 'member-loan-application', 'icon' => 'FilePlus', 'order' => 1],
            ['name' => 'Loan Disbursement', 'slug' => 'member-loan-disbursement', 'icon' => 'HandCoins', 'order' => 2],
            ['name' => 'Loan Repayment', 'slug' => 'member-loan-repayment', 'icon' => 'CreditCard', 'order' => 3],
            ['name' => 'Loan Closing', 'slug' => 'member-loan-closing', 'icon' => 'FileText', 'order' => 4],
            ['name' => 'Loan Accounts', 'slug' => 'member-loan-accounts', 'icon' => 'Briefcase', 'order' => 5],
            ['name' => 'Loan Migration', 'slug' => 'member-loan-migration', 'icon' => 'Upload', 'order' => 6],
        ];

        foreach ($children as $child) {
            Menu::firstOrCreate(
                ['slug' => $child['slug']],
                [
                    ...$child,
                    'parent_id' => $parent->id,
                    'is_hidden' => false,
                ]
            );
        }
    }
}
