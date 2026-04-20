<?php

namespace Database\Seeders;

use App\Models\Menu;
use Illuminate\Database\Seeder;

class ProjectInvestmentMenuSeeder extends Seeder
{
    public function run(): void
    {
        $parent = Menu::firstOrCreate(
            ['slug' => 'project-investment-management'],
            [
                'name' => 'Project Investment',
                'icon' => 'Briefcase',
                'order' => 9,
                'parent_id' => null,
                'is_hidden' => false,
            ]
        );

        $children = [
            ['name' => 'Project Declaration', 'slug' => 'project-declarations', 'icon' => 'FilePlus', 'order' => 1],
            ['name' => 'Project Share Sale', 'slug' => 'project-share-sales', 'icon' => 'HandCoins', 'order' => 2],
            ['name' => 'Project Closing', 'slug' => 'project-closings', 'icon' => 'CreditCard', 'order' => 3],
            ['name' => 'Project Investors', 'slug' => 'project-investors', 'icon' => 'Users', 'order' => 4],
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
