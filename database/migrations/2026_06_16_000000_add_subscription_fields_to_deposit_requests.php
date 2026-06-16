<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tag deposits with the subscription month they pay for, so the system can
     * tell which months a member has paid vs. still owes (only deposits flagged
     * is_subscription count toward the monthly subscription dues).
     */
    public function up(): void
    {
        Schema::table('deposit_requests', function (Blueprint $table) {
            $table->boolean('is_subscription')->default(false)->after('savings_account_id');
            $table->unsignedTinyInteger('period_month')->nullable()->after('is_subscription'); // 1-12
            $table->unsignedSmallInteger('period_year')->nullable()->after('period_month');     // e.g. 2026
            $table->decimal('penalty_amount', 15, 2)->default(0)->after('period_year');          // overdue penalty portion

            $table->index(['member_id', 'is_subscription', 'period_year', 'period_month'], 'dep_req_subscription_period_idx');
        });
    }

    public function down(): void
    {
        Schema::table('deposit_requests', function (Blueprint $table) {
            $table->dropIndex('dep_req_subscription_period_idx');
            $table->dropColumn(['is_subscription', 'period_month', 'period_year', 'penalty_amount']);
        });
    }
};
