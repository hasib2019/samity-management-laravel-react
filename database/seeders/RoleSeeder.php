<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super-admin'],
            ['name' => 'Admin', 'slug' => 'admin'],
            ['name' => 'Manager', 'slug' => 'manager'],
            ['name' => 'User', 'slug' => 'user'],
        ];

        foreach ($roles as $roleData) {
            $role = Role::updateOrCreate(['slug' => $roleData['slug']], $roleData);
            
            // Assign all permissions to Super Admin
            if ($role->slug === 'super-admin') {
                $permissions = Permission::all();
                $role->permissions()->sync($permissions->pluck('id'));
            }
            // Assign specific permissions to User role
            if ($role->slug === 'user') {
                $userPermissions = [
                    'dashboard.view',
                    'member.view',
                    // Add more as needed for a basic user
                ];
                $perms = Permission::whereIn('slug', $userPermissions)->get();
                $role->permissions()->sync($perms->pluck('id'));
            }
        }
    }
}
