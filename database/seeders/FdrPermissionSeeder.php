<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class FdrPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // FDR Application Permissions
            [
                'name' => 'fdr.application.view',
                'description' => 'Can view FDR applications',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.application.create',
                'description' => 'Can create new FDR applications',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.application.edit',
                'description' => 'Can edit FDR applications',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.application.delete',
                'description' => 'Can delete FDR applications',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.list.view',
                'description' => 'Alternative permission to view FDR list',
                'group' => 'FDR Management',
            ],

            // FDR Collection Permissions
            [
                'name' => 'fdr.collection.view',
                'description' => 'Can view FDR interest collections',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.collection.create',
                'description' => 'Can record FDR interest collections',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.collection.edit',
                'description' => 'Can edit FDR collection records',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.collection.delete',
                'description' => 'Can delete/cancel FDR collections',
                'group' => 'FDR Management',
            ],

            // FDR Closing Permissions
            [
                'name' => 'fdr.closing.view',
                'description' => 'Can view FDR closings/redemptions',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.closing.create',
                'description' => 'Can record FDR closings',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.closing.edit',
                'description' => 'Can edit FDR closing records',
                'group' => 'FDR Management',
            ],
            [
                'name' => 'fdr.closing.delete',
                'description' => 'Can reverse/delete FDR closings',
                'group' => 'FDR Management',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                [
                    'description' => $permission['description'],
                    'group' => $permission['group'],
                ]
            );
        }
    }
}
