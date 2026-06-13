<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Safe schema hardening for the financial tables.
 *
 * Scope note: the broader review also recommended (all Medium severity) adding
 * a UNIQUE constraint on transactions.tran_num, foreign keys on
 * transactions.(glac_id|samity_id|product_id), and soft-deletes + restrict-on-delete
 * across the financial tables. Those are intentionally deferred here because:
 *   - a UNIQUE tran_num would break the existing date('YmdHis').rand() generation
 *     used across ~9 controllers until that generation is overhauled everywhere;
 *   - adding FKs / flipping cascade->restrict requires orphan cleanup on a
 *     populated production DB and a query-behaviour review for soft-deletes.
 * This migration ships only the zero-regression, high-value parts: report indexes
 * and one-loan-account-per-application uniqueness (which backs the WS3
 * double-disbursement fix).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Used by trial-balance / balance-sheet / cash-flow / expense / revenue reports.
            $table->index('glac_id');
            $table->index('batch_num');
            $table->index(['status', 'tran_date', 'glac_id'], 'transactions_status_date_glac_index');
        });

        Schema::table('loan_accounts', function (Blueprint $table) {
            // One loan account per application — a second disbursement insert now fails loudly.
            $table->unique('loan_application_id');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['glac_id']);
            $table->dropIndex(['batch_num']);
            $table->dropIndex('transactions_status_date_glac_index');
        });

        Schema::table('loan_accounts', function (Blueprint $table) {
            $table->dropUnique(['loan_application_id']);
        });
    }
};
