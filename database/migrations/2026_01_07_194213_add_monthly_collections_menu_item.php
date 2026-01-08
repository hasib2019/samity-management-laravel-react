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
            'name' => 'Monthly Collections',
            'slug' => 'monthly-collections',
            'icon' => 'dollar-sign',
            'order' => 7,
        ]);
    }

    public function down(): void
    {
        Menu::where('slug', 'monthly-collections')->delete();
    }
};
