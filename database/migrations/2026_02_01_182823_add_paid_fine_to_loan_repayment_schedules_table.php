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
            $table->decimal('paid_fine', 10, 2)->default(0)->after('paid_interest');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loan_repayment_schedules', function (Blueprint $table) {
            $table->dropColumn('paid_fine');
        });
    }
};
