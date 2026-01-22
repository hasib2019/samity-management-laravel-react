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
        Schema::table('loan_repayment_schedules', function (Blueprint $table) {
            $table->decimal('paid_amount', 12, 2)->default(0)->after('total_amount');
            $table->decimal('paid_principal', 12, 2)->default(0)->after('paid_amount');
            $table->decimal('paid_interest', 12, 2)->default(0)->after('paid_principal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loan_repayment_schedules', function (Blueprint $table) {
            $table->dropColumn(['paid_amount', 'paid_principal', 'paid_interest']);
        });
    }
};
