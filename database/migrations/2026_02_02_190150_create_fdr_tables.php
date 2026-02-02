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
        Schema::create('fdr_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->unsignedBigInteger('product_id');
            $table->string('account_no')->unique();
            $table->decimal('fdr_amount', 15, 2)->comment('Principal Amount');
            $table->integer('duration')->comment('Duration in Months');
            $table->decimal('interest_rate', 5, 2)->default(0);
            $table->enum('interest_payment_type', ['monthly', 'quarterly', 'half_yearly', 'yearly', 'maturity'])->default('maturity');
            $table->date('start_date');
            $table->date('maturity_date');
            $table->decimal('maturity_amount', 15, 2)->default(0);
            $table->enum('status', ['active', 'closed', 'matured'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('member_infos')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('product_mst');
        });

        Schema::create('fdr_nominees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fdr_application_id');
            $table->string('nominee_name');
            $table->string('relation');
            $table->date('dob')->nullable();
            $table->string('nid')->nullable();
            $table->decimal('percentage', 5, 2)->default(100);
            $table->string('image')->nullable();
            $table->timestamps();

            $table->foreign('fdr_application_id')->references('id')->on('fdr_applications')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fdr_nominees');
        Schema::dropIfExists('fdr_applications');
    }
};
