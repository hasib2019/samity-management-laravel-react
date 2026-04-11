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
        Schema::create('fdr_collections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fdr_application_id');
            $table->date('collection_date');
            $table->decimal('interest_amount', 15, 2);
            $table->date('period_from');
            $table->date('period_to');
            $table->enum('collection_type', ['monthly', 'quarterly', 'half_yearly', 'yearly'])->default('monthly');
            $table->enum('status', ['pending', 'collected', 'cancelled'])->default('pending');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('fdr_application_id')->references('id')->on('fdr_applications')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fdr_collections');
    }
};
