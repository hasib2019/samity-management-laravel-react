<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('product_mst') || !Schema::hasColumn('product_mst', 'product_type')) {
            return;
        }

        DB::statement("
            ALTER TABLE product_mst
            MODIFY COLUMN product_type ENUM('saving', 'share', 'fdr', 'dps', 'loan', 'member_loan') NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('product_mst') || !Schema::hasColumn('product_mst', 'product_type')) {
            return;
        }

        DB::statement("
            ALTER TABLE product_mst
            MODIFY COLUMN product_type ENUM('saving', 'share', 'fdr', 'dps', 'loan') NOT NULL
        ");
    }
};
