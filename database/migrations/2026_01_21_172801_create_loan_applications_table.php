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
        Schema::create('loan_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('member_infos')->onDelete('cascade');
            $table->foreignId('samity_id')->constrained('samity_profiles')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('product_mst');
            
            $table->decimal('amount', 15, 2);
            $table->integer('duration_months');
            $table->decimal('interest_rate', 5, 2);
            $table->enum('installment_type', ['weekly', 'monthly'])->default('weekly');
            
            $table->date('apply_date');
            $table->text('purpose')->nullable();
            
            // Approval info
            $table->string('approval_no')->nullable();
            $table->date('approval_date')->nullable();
            $table->string('approval_by')->nullable();
            // Rejection info
            $table->string('rejection_reason')->nullable();
            
            $table->string('status')->default('pending'); // pending, approved, rejected, disbursed
            $table->date('disbursed_date')->nullable();
            $table->text('remarks')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            
            $table->index('status');
            $table->index('apply_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_applications');
    }
};
