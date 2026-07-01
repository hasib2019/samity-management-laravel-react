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
        Schema::create('loan_nominees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_application_id')->constrained('loan_applications')->onDelete('cascade');
            $table->enum('nominee_type', ['member', 'external'])->default('external');
            $table->foreignId('member_id')->nullable()->constrained('member_infos')->nullOnDelete();
            $table->string('nominee_name')->nullable();
            $table->string('relation')->nullable();
            $table->date('dob')->nullable();
            $table->string('nid')->nullable();
            $table->decimal('percentage', 5, 2)->default(100.00);
            
            // Document paths
            $table->string('image')->nullable();
            $table->string('signature')->nullable();
            $table->string('nid_image')->nullable();
            $table->string('other_documents')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_nominees');
    }
};
