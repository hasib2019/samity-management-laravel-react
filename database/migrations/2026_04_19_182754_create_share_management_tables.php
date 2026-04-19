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
        Schema::create('share_accounts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id');
            $table->unsignedBigInteger('product_id');
            $table->string('account_no')->unique();
            $table->decimal('total_shares', 15, 2)->default(0);
            $table->decimal('face_value', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->enum('status', ['active', 'closed'])->default('active');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('member_infos')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('product_mst');
        });

        Schema::create('share_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('share_account_id');
            $table->date('tran_date');
            $table->enum('tran_type', ['purchase', 'sale', 'transfer_in', 'transfer_out']);
            $table->decimal('quantity', 15, 2);
            $table->decimal('face_value', 15, 2);
            $table->decimal('amount', 15, 2);
            $table->unsignedBigInteger('related_account_id')->nullable()->comment('For transfers');
            $table->string('remarks')->nullable();
            $table->string('status')->default('posted');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('share_account_id')->references('id')->on('share_accounts')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('share_transactions');
        Schema::dropIfExists('share_accounts');
    }
};
