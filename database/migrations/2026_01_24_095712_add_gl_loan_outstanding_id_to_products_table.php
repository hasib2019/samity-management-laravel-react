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
            $table->unsignedBigInteger('gl_loan_outstanding_id')->nullable()->after('gl_principal_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_mst', function (Blueprint $table) {
            $table->dropColumn('gl_loan_outstanding_id');
        });
    }
};
