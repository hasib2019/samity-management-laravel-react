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
        Schema::create('savings_products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('currency_id')->default('BDT');
            $table->decimal('interest_rate', 10, 2); // Yearly Interest Rate (%)
            $table->string('interest_method')->default('daily_outstanding_balance');
            $table->integer('interest_period'); // 1, 3, 6, 12
            $table->integer('interest_posting_period')->nullable(); // Not explicitly defined in UI instructions but present in column list
            $table->decimal('min_bal_interest_rate', 15, 2)->default(0); // Minimum Balance for Interest
            $table->boolean('allow_withdraw')->default(true);
            $table->decimal('minimum_account_balance', 15, 2)->default(0);
            $table->decimal('minimum_deposit_amount', 15, 2)->default(0);
            $table->decimal('maintenance_fee', 15, 2)->default(0);
            $table->string('maintenance_fee_posting_period')->nullable(); // jan-dec select option
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('savings_products');
    }
};
