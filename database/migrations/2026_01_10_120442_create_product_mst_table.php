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
        Schema::create('product_mst', function (Blueprint $table) {
            $table->id();
            $table->string('product_code')->unique();
            $table->string('product_name');
            $table->enum('product_type', ['saving', 'share', 'fdr', 'dps', 'loan']);
            $table->enum('product_category', ['deposit', 'investment', 'credit']);
            $table->string('rate_type')->nullable();
            // Amount Rules
            $table->decimal('min_amount', 15, 2)->default(0);
            $table->decimal('max_amount', 15, 2)->default(0);

            // Tenure Rules
            $table->boolean('tenure_required')->default(false);
            $table->integer('min_tenure_month')->nullable();
            $table->integer('max_tenure_month')->nullable();

            // Profit / Interest
            $table->boolean('profit_applicable')->default(false);
            $table->decimal('profit_rate', 5, 2)->nullable();
            $table->enum('profit_calculation', ['daily', 'monthly', 'yearly', 'maturity'])->nullable();
            $table->enum('profit_posting', ['monthly', 'quarterly', 'maturity'])->nullable();

            // Installment (DPS / Loan)
            $table->boolean('installment_required')->default(false);
            $table->enum('installment_type', ['monthly', 'weekly'])->nullable();
            $table->decimal('installment_amount', 15, 2)->nullable();

            // Loan Only
            $table->enum('loan_calculation', ['flat', 'reducing'])->nullable();
            $table->integer('grace_period_month')->default(0);

            // Penalty
            $table->boolean('penalty_applicable')->default(false);
            $table->decimal('penalty_rate', 5, 2)->nullable();

            // Accounting Mapping (FKs to glac_mst)
            $table->unsignedBigInteger('gl_principal_id')->nullable();
            $table->unsignedBigInteger('gl_profit_id')->nullable();
            $table->unsignedBigInteger('gl_penalty_id')->nullable();
            $table->unsignedBigInteger('gl_income_id')->nullable();
            $table->unsignedBigInteger('gl_expense_id')->nullable();

            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            // Foreign Key Constraints (Optional but recommended)
            // $table->foreign('gl_principal_id')->references('id')->on('glac_mst');
            // Keeping it simple to avoid migration errors if glac_mst is different (e.g. MyISAM or diff engine, though unlikely in Laravel 10+)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('product_mst');
        Schema::enableForeignKeyConstraints();
    }
};
