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
        Schema::create('voucher_gl_mappings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('voucher_type_id')->index();
            $table->unsignedBigInteger('debit_glac_id')->index();
            $table->unsignedBigInteger('credit_glac_id')->index();
            $table->text('naration')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('voucher_type_id')->references('id')->on('types')->onDelete('cascade');
            $table->foreign('debit_glac_id')->references('id')->on('glac_mst')->onDelete('cascade');
            $table->foreign('credit_glac_id')->references('id')->on('glac_mst')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voucher_gl_mappings');
    }
};

