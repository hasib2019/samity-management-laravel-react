<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_schedules', function (Blueprint $table) {
            $table->id();
            $table->integer('month');
            $table->integer('year');
            $table->boolean('is_active')->default(false);
            $table->date('penalty_start_date');
            $table->text('note')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->unique(['month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_schedules');
    }
};
