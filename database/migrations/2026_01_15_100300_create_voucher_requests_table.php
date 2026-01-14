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
        Schema::create('voucher_requests', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('voucher_type_id')->index();
            $table->unsignedBigInteger('member_id')->index();
            $table->unsignedBigInteger('method_id')->nullable();
            $table->unsignedBigInteger('customer_account_id')->nullable()->index();

            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('converted_amount', 15, 2)->default(0);

            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->string('attachment')->nullable();

            $table->string('status')->default('pending');

            $table->unsignedBigInteger('transaction_id')->nullable()->index();

            $table->timestamps();

            $table->foreign('voucher_type_id')->references('id')->on('types')->onDelete('cascade');
            $table->foreign('member_id')->references('id')->on('member_infos')->onDelete('cascade');
            $table->foreign('transaction_id')->references('id')->on('transactions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voucher_requests');
    }
};

