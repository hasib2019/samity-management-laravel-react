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
        Schema::create('withdraw_requests', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('member_id')->index();
            $table->unsignedBigInteger('method_id')->nullable();

            $table->unsignedBigInteger('debit_account_id')->nullable()->index();
            $table->foreign('debit_account_id')
                ->references('id')
                ->on('savings_accounts')
                ->onDelete('cascade');

            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('converted_amount', 15, 2)->default(0);

            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->string('attachment')->nullable();

            $table->string('status')->default('pending');

            $table->unsignedBigInteger('transaction_id')->nullable()->index();
            $table->foreign('transaction_id')
                ->references('id')
                ->on('transactions')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('withdraw_requests');
    }
};

