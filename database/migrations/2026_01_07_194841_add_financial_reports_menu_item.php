<?php

use App\Models\Menu;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Menu::create([
            'name' => 'Financial Reports',
            'slug' => 'financial-reports',
            'icon' => 'bar-chart-2',
            'order' => 8,
        ]);
    }

    public function down(): void
    {
        Menu::where('slug', 'financial-reports')->delete();
    }
};
