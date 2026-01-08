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
        Schema::table('samity_profiles', function (Blueprint $table) {
            $table->decimal('monthly_subscription_fee', 10, 2)->default(1000);
            $table->decimal('penalty_amount', 10, 2)->default(200);
            $table->integer('penalty_late_date')->default(15);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('samity_profiles', function (Blueprint $table) {
            $table->dropColumn(['monthly_subscription_fee', 'penalty_amount', 'penalty_late_date']);
        });
    }
};
