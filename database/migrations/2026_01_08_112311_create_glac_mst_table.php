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
        Schema::create('glac_mst', function (Blueprint $table) {
            $table->id();
            $table->string('glac_code', 30);
            $table->string('glac_name', 200);
            $table->string('parent_child', 1); // P=Parent, C=Child
            $table->integer('parent_id')->nullable();
            $table->string('glac_type', 1); // A=Asset, L=Liability, I=Income, E=Expense
            $table->integer('level_code')->nullable();
            $table->string('gl_nature', 1); // D=Debit, C=Credit
            $table->string('allow_manual_dr', 1)->default('N'); // Y/N
            $table->string('allow_manual_cr', 1)->default('N'); // Y/N
            $table->string('status', 1)->default('N'); // A=Active, N=New/Inactive
            
            // Audit fields
            $table->string('auth_by', 50)->nullable();
            $table->date('auth_date')->nullable();
            
            // Standard Laravel Audit fields (mapping created_by/updated_by to users table)
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();

            // Additional fields
            $table->boolean('is_default')->default(false);
            $table->integer('doptor_id')->default(0); // Kept as requested, default 0
            $table->boolean('is_abonton')->default(false);
            $table->integer('is_percentage')->default(0);
            $table->boolean('is_carry_forward')->default(false);
            $table->boolean('is_income_expense')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('glac_mst');
    }
};
