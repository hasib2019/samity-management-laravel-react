<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class CommitteeMenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Main Committee Management Menu
        $committeeMenu = Menu::firstOrCreate(
            ['slug' => 'committee-management'],
            [
                'name' => 'Committee Management',
                'icon' => 'users',
                'order' => 8,
                'parent_id' => null,
                'is_hidden' => false
            ]
        );

        // Committee Types Sub-menu
        Menu::firstOrCreate(
            ['slug' => 'committee-types'],
            [
                'name' => 'Committee Types',
                'icon' => 'list',
                'order' => 1,
                'parent_id' => $committeeMenu->id,
                'is_hidden' => false
            ]
        );

        // Committees Sub-menu
        Menu::firstOrCreate(
            ['slug' => 'committees-list'],
            [
                'name' => 'Committees',
                'icon' => 'briefcase',
                'order' => 2,
                'parent_id' => $committeeMenu->id,
                'is_hidden' => false
            ]
        );

        // Committee Reports Sub-menu
        Menu::firstOrCreate(
            ['slug' => 'committee-reports'],
            [
                'name' => 'Committee Reports',
                'icon' => 'file-text',
                'order' => 3,
                'parent_id' => $committeeMenu->id,
                'is_hidden' => false
            ]
        );
    }
}
