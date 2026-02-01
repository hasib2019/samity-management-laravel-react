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
        Schema::create('dps_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->unsignedBigInteger('product_id');
            $table->string('account_no')->unique();
            $table->decimal('dps_amount', 15, 2)->comment('Monthly Installment Amount');
            $table->integer('duration')->comment('Duration in Months');
            $table->decimal('interest_rate', 5, 2)->default(0);
            $table->integer('total_installment')->comment('Total Number of Installments');
            $table->date('start_date');
            $table->date('maturity_date');
            $table->decimal('maturity_amount', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0)->comment('Total Deposited Amount');
            $table->enum('status', ['active', 'closed', 'matured'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('member_infos')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('product_mst');
        });

        Schema::create('dps_installments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('dps_application_id');
            $table->integer('installment_no');
            $table->date('due_date');
            $table->decimal('amount', 15, 2);
            $table->decimal('fine_amount', 15, 2)->default(0);
            $table->date('paid_date')->nullable();
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'overdue', 'advance'])->default('pending');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->foreign('dps_application_id')->references('id')->on('dps_applications')->onDelete('cascade');
        });

        Schema::create('dps_nominees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('dps_application_id');
            $table->string('nominee_name');
            $table->string('relation');
            $table->date('dob')->nullable();
            $table->string('nid')->nullable();
            $table->decimal('percentage', 5, 2)->default(100);
            $table->string('image')->nullable();
            $table->timestamps();

            $table->foreign('dps_application_id')->references('id')->on('dps_applications')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dps_nominees');
        Schema::dropIfExists('dps_installments');
        Schema::dropIfExists('dps_applications');
    }
};
