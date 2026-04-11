<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            MenuSeeder::class,
            ReportMenuSeeder::class,
            PermissionSeeder::class,
            CodeMasterMenuSeeder::class,
            FdrMenuSeeder::class,
            CommitteePermissionSeeder::class,
            CommitteeTypeSeeder::class,
            CommitteeMenuSeeder::class,
            UserSeeder::class,
        ]);
    }
}
