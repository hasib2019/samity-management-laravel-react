<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class CommitteePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Committee permissions - assuming the permissions table structure has 'name' and 'slug'
        $permissions = [
            'committee.type.view' => 'committee-type-view',
            'committee.type.create' => 'committee-type-create',
            'committee.type.edit' => 'committee-type-edit',
            'committee.type.delete' => 'committee-type-delete',
            'committee.view' => 'committee-view',
            'committee.create' => 'committee-create',
            'committee.edit' => 'committee-edit',
            'committee.delete' => 'committee-delete',
            'committee.submit' => 'committee-submit',
            'committee.approve' => 'committee-approve',
        ];

        // Get the Committee menu or create it
        $menu = \App\Models\Menu::firstOrCreate(
            ['slug' => 'committee-management'],
            [
                'name' => 'Committee Management',
                'icon' => 'users',
                'order' => 8,
                'is_hidden' => false
            ]
        );

        foreach ($permissions as $name => $slug) {
            Permission::firstOrCreate(
                ['name' => $name, 'slug' => $slug],
                ['menu_id' => $menu->id]
            );
        }
    }
}
