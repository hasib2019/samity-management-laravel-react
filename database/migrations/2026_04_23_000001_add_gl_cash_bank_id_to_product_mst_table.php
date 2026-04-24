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
            if (!Schema::hasColumn('product_mst', 'gl_cash_bank_id')) {
                $table->unsignedBigInteger('gl_cash_bank_id')->nullable()->after('gl_expense_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_mst', function (Blueprint $table) {
            if (Schema::hasColumn('product_mst', 'gl_cash_bank_id')) {
                $table->dropColumn('gl_cash_bank_id');
            }
        });
    }
};
