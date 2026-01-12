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
        Schema::create('deposit_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id')->index();
            $table->unsignedBigInteger('method_id')->nullable();
            
            // savings_account_id is a Foreign Key to savings_accounts table
            $table->unsignedBigInteger('savings_account_id')->nullable()->index();
            $table->foreign('savings_account_id')->references('id')->on('savings_accounts')->onDelete('cascade');

            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('charge', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            $table->text('description')->nullable();
            $table->text('requirements')->nullable(); // Could be JSON if structured data
            $table->string('attachment')->nullable();
            
            $table->string('status')->default('pending'); // pending, approved, rejected
            
            // transaction_id is a Foreign Key to transactions table
            $table->unsignedBigInteger('transaction_id')->nullable()->index();
            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deposit_requests');
    }
};
