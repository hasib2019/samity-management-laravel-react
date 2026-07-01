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
            $table->enum('product_type', ['saving', 'share', 'fdr', 'dps', 'loan', 'member_loan']);
            $table->enum('product_category', ['deposit', 'investment', 'credit']);
            $table->string('rate_type')->nullable();
            // Amount Rules
            $table->decimal('min_amount', 15, 2)->default(0);
            $table->decimal('max_amount', 15, 2)->default(0);
            $table->decimal('face_value', 15, 2)->nullable();

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

            // Accounting Mapping (FKs to glac_mst) — per product-type GL mapping
            $table->unsignedBigInteger('sav_dep_lib_cr_gl_id')->nullable();
            $table->unsignedBigInteger('sav_penalty_income_cr_gl_id')->nullable();
            $table->unsignedBigInteger('sav_cash_bank_dr_gl_id')->nullable();
            $table->unsignedBigInteger('sav_interest_exp_dr_gl_id')->nullable();
            $table->unsignedBigInteger('dps_dep_lib_cr_gl_id')->nullable();
            $table->unsignedBigInteger('dps_penalty_income_cr_gl_id')->nullable();
            $table->unsignedBigInteger('dps_cash_bank_dr_gl_id')->nullable();
            $table->unsignedBigInteger('dps_interest_exp_dr_gl_id')->nullable();
            $table->unsignedBigInteger('fdr_dep_lib_cr_gl_id')->nullable();
            $table->unsignedBigInteger('fdr_penalty_income_cr_gl_id')->nullable();
            $table->unsignedBigInteger('fdr_cash_bank_dr_gl_id')->nullable();
            $table->unsignedBigInteger('fdr_interest_exp_dr_gl_id')->nullable();
            $table->unsignedBigInteger('shr_capital_cr_gl_id')->nullable();
            $table->unsignedBigInteger('shr_cash_bank_dr_gl_id')->nullable();
            $table->unsignedBigInteger('shr_fee_income_cr_gl_id')->nullable();
            $table->unsignedBigInteger('loan_portfolio_dr_gl_id')->nullable();
            $table->unsignedBigInteger('loan_cash_bank_cr_gl_id')->nullable();
            $table->unsignedBigInteger('loan_interest_income_cr_gl_id')->nullable();
            $table->unsignedBigInteger('loan_penalty_income_cr_gl_id')->nullable();
            $table->unsignedBigInteger('loan_waiver_exp_dr_gl_id')->nullable();
            $table->unsignedBigInteger('loan_loss_provision_exp_dr_gl_id')->nullable();
            $table->unsignedBigInteger('mem_loan_portfolio_dr_gl_id')->nullable();
            $table->unsignedBigInteger('mem_loan_cash_bank_cr_gl_id')->nullable();
            $table->unsignedBigInteger('mem_loan_interest_income_cr_gl_id')->nullable();
            $table->unsignedBigInteger('mem_loan_penalty_income_cr_gl_id')->nullable();
            $table->unsignedBigInteger('mem_loan_waiver_exp_dr_gl_id')->nullable();
            $table->unsignedBigInteger('mem_loan_loss_provision_exp_dr_gl_id')->nullable();

            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
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
