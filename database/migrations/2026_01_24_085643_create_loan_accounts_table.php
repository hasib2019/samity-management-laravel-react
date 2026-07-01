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
        Schema::create('loan_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_application_id')->constrained()->onDelete('cascade');
            $table->foreignId('member_id')->constrained('member_infos')->onDelete('cascade'); // Assuming member_infos table
            $table->string('account_no')->unique();
            
            // Loan Amounts
            $table->decimal('principal_amount', 15, 2);
            $table->decimal('interest_amount', 15, 2);
            $table->decimal('total_payable', 15, 2); // Principal + Interest
            
            // Tracking Balance
            $table->decimal('current_balance', 15, 2); // Decreases as they pay
            $table->decimal('total_paid', 15, 2)->default(0);
            $table->decimal('principal_paid', 15, 2)->default(0);
            $table->decimal('interest_paid', 15, 2)->default(0);
            
            $table->date('disbursed_date');
            $table->date('closed_date')->nullable();
            
            $table->enum('status', ['active', 'closed', 'written_off'])->default('active');
            
            $table->timestamps();
            
            // Indexes for faster searching
            $table->index('account_no');
            $table->index('status');

            // One loan account per application — a second disbursement insert now fails loudly.
            $table->unique('loan_application_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_accounts');
    }
};
