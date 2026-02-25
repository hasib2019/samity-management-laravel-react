<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Support\Str;

class HRPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $hrMenu = Menu::firstOrCreate(
            ['slug' => 'hr'],
            [
                'name' => 'HR',
                'icon' => 'Briefcase',
                'order' => 500,
                'is_hidden' => true,
            ]
        );

        $settingsMenu = Menu::firstOrCreate(
            ['slug' => 'hr-settings'],
            [
                'name' => 'HR Settings',
                'icon' => 'Settings',
                'parent_id' => $hrMenu->id,
                'order' => 1,
                'is_hidden' => true,
            ]
        );

        $employeesMenu = Menu::firstOrCreate(
            ['slug' => 'hr-employees'],
            [
                'name' => 'Employees',
                'icon' => 'Users',
                'parent_id' => $hrMenu->id,
                'order' => 2,
                'is_hidden' => true,
            ]
        );

        $attendanceMenu = Menu::firstOrCreate(
            ['slug' => 'hr-attendance'],
            [
                'name' => 'Attendance',
                'icon' => 'UserCheck',
                'parent_id' => $hrMenu->id,
                'order' => 3,
                'is_hidden' => true,
            ]
        );

        $leavesMenu = Menu::firstOrCreate(
            ['slug' => 'hr-leaves'],
            [
                'name' => 'Leaves',
                'icon' => 'FileText',
                'parent_id' => $hrMenu->id,
                'order' => 4,
                'is_hidden' => true,
            ]
        );

        foreach (['view','create','edit','delete'] as $action) {
            Permission::updateOrCreate(
                ['slug' => 'hr.setup.' . $action],
                [
                    'name' => 'HR Settings ' . ucfirst($action),
                    'menu_id' => $settingsMenu->id,
                ]
            );
        }

        foreach (['view','create','edit','delete'] as $action) {
            Permission::updateOrCreate(
                ['slug' => 'hr.employee.' . $action],
                [
                    'name' => 'HR Employee ' . ucfirst($action),
                    'menu_id' => $employeesMenu->id,
                ]
            );
        }

        foreach (['view','create','edit','delete'] as $action) {
            Permission::updateOrCreate(
                ['slug' => 'hr.attendance.' . $action],
                [
                    'name' => 'HR Attendance ' . ucfirst($action),
                    'menu_id' => $attendanceMenu->id,
                ]
            );
        }

        foreach (['view','create','edit','delete'] as $action) {
            Permission::updateOrCreate(
                ['slug' => 'hr.leave.' . $action],
                [
                    'name' => 'HR Leave ' . ucfirst($action),
                    'menu_id' => $leavesMenu->id,
                ]
            );
        }

        Permission::updateOrCreate(
            ['slug' => 'hr.leave.approve'],
            [
                'name' => 'HR Leave Approve',
                'menu_id' => $leavesMenu->id,
            ]
        );
    }
}
