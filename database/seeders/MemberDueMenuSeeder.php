<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class MemberDueMenuSeeder extends Seeder
{
    public function run(): void
    {
        $parent = Menu::where('slug', 'deposit-withdraw')->first();
        if (! $parent) {
            return;
        }

        $menu = Menu::updateOrCreate(
            ['slug' => 'member-due'],
            [
                'name' => 'Member Due',
                'icon' => 'HandCoins',
                'order' => 5,
                'parent_id' => $parent->id,
                'is_hidden' => false,
            ]
        );

        Permission::updateOrCreate(
            ['slug' => 'subscription.due.view'],
            [
                'name' => 'Member Subscription Due View',
                'menu_id' => $menu->id,
            ]
        );
    }
}
