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
        Schema::create('monthly_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('member_infos')->onDelete('cascade');
            $table->integer('month');
            $table->integer('year');
            $table->decimal('amount_collected', 10, 2)->default(0);
            $table->decimal('penalty_collected', 10, 2)->default(0);
            $table->date('collection_date');
            $table->foreignId('collected_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['member_id', 'month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_collections');
    }
};
