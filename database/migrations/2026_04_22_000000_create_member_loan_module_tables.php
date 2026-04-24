<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('member_loan_applications')) {
            Schema::create('member_loan_applications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('samity_id')->constrained('samity_profiles')->cascadeOnDelete();
                $table->foreignId('member_id')->constrained('member_infos')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('product_mst');
                $table->string('application_no')->unique();
                $table->date('application_date');
                $table->decimal('requested_amount', 15, 2);
                $table->decimal('approved_amount', 15, 2)->nullable();
                $table->unsignedInteger('tenure_months');
                $table->decimal('monthly_interest_rate', 8, 4)->default(1.0000);
                $table->date('approved_date')->nullable();
                $table->date('disbursed_date')->nullable();
                $table->text('purpose')->nullable();
                $table->text('remarks')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected', 'disbursed', 'closed', 'cancelled'])->default('pending');
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->unsignedBigInteger('disbursed_by')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                $table->index(['status', 'application_date'], 'mla_status_app_dt_idx');
            });
        }

        if (!Schema::hasTable('member_loan_accounts')) {
            Schema::create('member_loan_accounts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('member_loan_application_id')->unique()->constrained('member_loan_applications')->cascadeOnDelete();
                $table->foreignId('samity_id')->constrained('samity_profiles')->cascadeOnDelete();
                $table->foreignId('member_id')->constrained('member_infos')->cascadeOnDelete();
                $table->foreignId('product_id')->constrained('product_mst');
                $table->string('account_no')->unique();
                $table->date('disbursed_date');
                $table->decimal('original_principal', 15, 2);
                $table->decimal('outstanding_principal', 15, 2);
                $table->decimal('accrued_interest_balance', 15, 2)->default(0);
                $table->decimal('overdue_interest_balance', 15, 2)->default(0);
                $table->decimal('total_outstanding', 15, 2)->default(0);
                $table->decimal('monthly_interest_rate', 8, 4)->default(1.0000);
                $table->date('last_accrual_date')->nullable();
                $table->date('next_accrual_date')->nullable();
                $table->date('last_payment_date')->nullable();
                $table->decimal('total_interest_accrued', 15, 2)->default(0);
                $table->decimal('total_overdue_interest_accrued', 15, 2)->default(0);
                $table->decimal('total_paid_amount', 15, 2)->default(0);
                $table->decimal('total_principal_paid', 15, 2)->default(0);
                $table->decimal('total_interest_paid', 15, 2)->default(0);
                $table->decimal('total_overdue_interest_paid', 15, 2)->default(0);
                $table->date('closed_date')->nullable();
                $table->enum('status', ['active', 'overdue', 'closed'])->default('active');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                $table->index(['status', 'next_accrual_date'], 'mlacc_status_next_acc_idx');
            });
        }

        if (!Schema::hasTable('member_loan_transactions')) {
            Schema::create('member_loan_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('member_loan_account_id')->constrained('member_loan_accounts')->cascadeOnDelete();
                $table->foreignId('member_loan_application_id')->nullable()->constrained('member_loan_applications')->nullOnDelete();
                $table->foreignId('samity_id')->nullable()->constrained('samity_profiles')->nullOnDelete();
                $table->foreignId('member_id')->nullable()->constrained('member_infos')->nullOnDelete();
                $table->foreignId('product_id')->nullable()->constrained('product_mst')->nullOnDelete();
                $table->date('transaction_date');
                $table->string('reference_no')->nullable();
                $table->string('batch_num')->nullable();
                $table->enum('transaction_type', ['disbursement', 'monthly_accrual', 'overdue_interest', 'repayment', 'closure', 'adjustment']);
                $table->decimal('input_emi_amount', 15, 2)->default(0);
                $table->decimal('input_interest_amount', 15, 2)->default(0);
                $table->decimal('input_total_amount', 15, 2)->default(0);
                $table->decimal('accrued_interest_amount', 15, 2)->default(0);
                $table->decimal('overdue_interest_amount', 15, 2)->default(0);
                $table->decimal('applied_interest_amount', 15, 2)->default(0);
                $table->decimal('applied_overdue_interest_amount', 15, 2)->default(0);
                $table->decimal('applied_principal_amount', 15, 2)->default(0);
                $table->decimal('principal_balance_after', 15, 2)->default(0);
                $table->decimal('interest_balance_after', 15, 2)->default(0);
                $table->decimal('overdue_balance_after', 15, 2)->default(0);
                $table->decimal('total_outstanding_after', 15, 2)->default(0);
                $table->text('remarks')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->index(['member_loan_account_id', 'transaction_date'], 'mltxn_acc_txn_dt_idx');
                $table->index(['transaction_type', 'transaction_date'], 'mltxn_type_txn_dt_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('member_loan_transactions');
        Schema::dropIfExists('member_loan_accounts');
        Schema::dropIfExists('member_loan_applications');
    }
};
