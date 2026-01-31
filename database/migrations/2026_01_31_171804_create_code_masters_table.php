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
        Schema::create('code_masters', function (Blueprint $table) {
            $table->id();
            $table->string('code_type')->index();
            $table->string('return_value');
            $table->string('display_value');
            $table->boolean('is_active')->default(true);
            $table->integer('display_serial')->nullable();
            $table->string('created_by')->nullable(); // Assuming string from JSON "dashboard"
            $table->string('updated_by')->nullable();
            $table->timestamps();
            
            // Optional: Unique constraint if needed
            // $table->unique(['code_type', 'return_value']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('code_masters');
    }
};
