<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class ReportMenuSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            [
                'name' => 'Reports',
                'slug' => 'reports',
                'icon' => 'BarChart3',
                'order' => 6, // After Loan Management (5)
                'children' => [
                    ['name' => 'Account Statement', 'slug' => 'account-statement', 'icon' => 'FileText', 'order' => 1],
                    ['name' => 'Account Balance', 'slug' => 'account-balance', 'icon' => 'Scale', 'order' => 2],
                    ['name' => 'Loan Report', 'slug' => 'loan-report', 'icon' => 'FileOutput', 'order' => 3],
                    ['name' => 'Loan Due Report', 'slug' => 'loan-due-report', 'icon' => 'AlertCircle', 'order' => 4],
                    ['name' => 'Transaction Report', 'slug' => 'transaction-report', 'icon' => 'History', 'order' => 5],
                    ['name' => 'Expense Report', 'slug' => 'expense-report', 'icon' => 'TrendingDown', 'order' => 6],
                    ['name' => 'Revenue Report', 'slug' => 'revenue-report', 'icon' => 'TrendingUp', 'order' => 7],
                    ['name' => 'Balance Sheet', 'slug' => 'balance-sheet', 'icon' => 'Sheet', 'order' => 8],
                    ['name' => 'Cash Flow', 'slug' => 'cash-flow', 'icon' => 'ArrowRightLeft', 'order' => 9],
                    ['name' => 'Trial Balance', 'slug' => 'trial-balance', 'icon' => 'Calculator', 'order' => 10],
                ]
            ],
        ];

        foreach ($menus as $menuData) {
            $children = $menuData['children'] ?? [];
            unset($menuData['children']);
            
            // Create Parent Menu
            $parent = Menu::updateOrCreate(
                ['slug' => $menuData['slug']],
                $menuData
            );

            // Create Permission for Parent
            Permission::updateOrCreate(
                ['slug' => $parent->slug . '.view'],
                [
                    'name' => $parent->name . ' View',
                    'menu_id' => $parent->id,
                ]
            );

            foreach ($children as $childData) {
                $childData['parent_id'] = $parent->id;
                
                // Create Child Menu
                $child = Menu::updateOrCreate(
                    ['slug' => $childData['slug']],
                    $childData
                );

                // Create Permission for Child
                Permission::updateOrCreate(
                    ['slug' => $child->slug . '.view'],
                    [
                        'name' => $child->name . ' View',
                        'menu_id' => $child->id,
                    ]
                );
            }
        }
    }
}
