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
        Schema::create('loan_guarantors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_application_id')->constrained()->onDelete('cascade');
            $table->enum('guarantor_type', ['member', 'external'])->default('external');
            
            // If member
            $table->foreignId('member_id')->nullable()->constrained('member_infos')->nullOnDelete();
            
            // If external (or override for member)
            $table->string('name')->nullable();
            $table->string('father_name')->nullable();
            $table->string('husband_name')->nullable();
            $table->string('relation')->nullable();
            $table->string('address')->nullable();
            $table->string('contact_no')->nullable();
            $table->string('nid')->nullable();
            
            // Files
            $table->string('image')->nullable();
            $table->string('signature')->nullable();
            $table->string('nid_image')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_guarantors');
    }
};
