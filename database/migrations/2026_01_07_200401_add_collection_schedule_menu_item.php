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
            'name' => 'Collection Schedule',
            'slug' => 'collection-schedules',
            'icon' => 'calendar',
            'order' => 9,
        ]);
    }

    public function down(): void
    {
        Menu::where('slug', 'collection-schedules')->delete();
    }
};
