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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id')->nullable(); // Typically maps to member_infos.id
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('samity_id')->nullable();
            
            $table->string('payment_mode')->nullable(); // cash, bank
            $table->string('tran_num')->nullable();
            $table->string('tran_code')->nullable();
            $table->string('batch_num')->nullable();
            
            $table->string('tran_type'); // Deposit, Withdraw, Loan Disbursement, Loan Repayment, etc.
            $table->date('tran_date');
            
            $table->unsignedBigInteger('glac_id')->nullable();
            $table->text('naration')->nullable();
            
            $table->decimal('dr_amt', 15, 2)->default(0);
            $table->decimal('cr_amt', 15, 2)->default(0);
            
            $table->string('status')->default('pending'); // pending, posted, cancelled
            $table->string('channel_code')->nullable();
            
            $table->unsignedBigInteger('rev_tran_id')->nullable();
            
            // Cheque/Bank Info
            $table->string('cheque_num')->nullable();
            $table->date('cheque_date')->nullable();
            $table->unsignedBigInteger('bank_id')->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->string('transfer_ac_no')->nullable();
            
            // Authorization
            $table->string('authorize_status')->default('pending');
            $table->unsignedBigInteger('authorized_by')->nullable();
            $table->dateTime('authorized_at')->nullable();
            
            // Audit
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            
            $table->timestamps();

            // Foreign Keys (Optional - keeping flexible as requested, but good practice to index)
            $table->index('customer_id');
            $table->index('product_id');
            $table->index('samity_id');
            $table->index('tran_date');
            $table->index('tran_type');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
