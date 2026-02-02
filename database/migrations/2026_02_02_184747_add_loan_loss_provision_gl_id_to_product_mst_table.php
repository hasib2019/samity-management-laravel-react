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
            $table->unsignedBigInteger('loan_loss_provision_gl_id')->nullable()->after('gl_waiver_id');
            $table->foreign('loan_loss_provision_gl_id')->references('id')->on('glac_mst')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_mst', function (Blueprint $table) {
            $table->dropForeign(['loan_loss_provision_gl_id']);
            $table->dropColumn('loan_loss_provision_gl_id');
        });
    }
};
