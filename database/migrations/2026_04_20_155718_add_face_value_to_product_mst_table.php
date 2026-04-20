<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('product_mst', function (Blueprint $table) {
            $table->decimal('face_value', 15, 2)->nullable()->after('max_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_mst', function (Blueprint $table) {
            $table->dropColumn('face_value');
        });
    }
};
