<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('product_mst')) {
            return;
        }

        Schema::table('product_mst', function (Blueprint $table) {
            $columns = [
                'sav_dep_lib_cr_gl_id',
                'sav_penalty_income_cr_gl_id',
                'sav_cash_bank_dr_gl_id',
                'sav_interest_exp_dr_gl_id',
                'dps_dep_lib_cr_gl_id',
                'dps_penalty_income_cr_gl_id',
                'dps_cash_bank_dr_gl_id',
                'dps_interest_exp_dr_gl_id',
                'fdr_dep_lib_cr_gl_id',
                'fdr_penalty_income_cr_gl_id',
                'fdr_cash_bank_dr_gl_id',
                'fdr_interest_exp_dr_gl_id',
                'shr_capital_cr_gl_id',
                'shr_cash_bank_dr_gl_id',
                'shr_fee_income_cr_gl_id',
                'loan_portfolio_dr_gl_id',
                'loan_cash_bank_cr_gl_id',
                'loan_interest_income_cr_gl_id',
                'loan_penalty_income_cr_gl_id',
                'loan_waiver_exp_dr_gl_id',
                'loan_loss_provision_exp_dr_gl_id',
                'mem_loan_portfolio_dr_gl_id',
                'mem_loan_cash_bank_cr_gl_id',
                'mem_loan_interest_income_cr_gl_id',
                'mem_loan_penalty_income_cr_gl_id',
                'mem_loan_waiver_exp_dr_gl_id',
                'mem_loan_loss_provision_exp_dr_gl_id',
            ];

            foreach ($columns as $column) {
                if (!Schema::hasColumn('product_mst', $column)) {
                    $table->unsignedBigInteger($column)->nullable();
                }
            }
        });

        $canBackfillLegacyMappings = Schema::hasColumn('product_mst', 'gl_principal_id')
            || Schema::hasColumn('product_mst', 'gl_loan_outstanding_id')
            || Schema::hasColumn('product_mst', 'gl_income_id');

        if ($canBackfillLegacyMappings) {
            DB::table('product_mst')
                ->where('product_type', 'saving')
                ->update([
                    'sav_dep_lib_cr_gl_id' => DB::raw('COALESCE(gl_principal_id, gl_income_id)'),
                    'sav_penalty_income_cr_gl_id' => DB::raw('gl_penalty_id'),
                    'sav_cash_bank_dr_gl_id' => DB::raw('COALESCE(gl_cash_bank_id, gl_expense_id)'),
                    'sav_interest_exp_dr_gl_id' => DB::raw('gl_profit_id'),
                ]);

            DB::table('product_mst')
                ->where('product_type', 'dps')
                ->update([
                    'dps_dep_lib_cr_gl_id' => DB::raw('gl_principal_id'),
                    'dps_penalty_income_cr_gl_id' => DB::raw('gl_penalty_id'),
                    'dps_cash_bank_dr_gl_id' => DB::raw('gl_cash_bank_id'),
                    'dps_interest_exp_dr_gl_id' => DB::raw('gl_profit_id'),
                ]);

            DB::table('product_mst')
                ->where('product_type', 'fdr')
                ->update([
                    'fdr_dep_lib_cr_gl_id' => DB::raw('gl_principal_id'),
                    'fdr_penalty_income_cr_gl_id' => DB::raw('gl_penalty_id'),
                    'fdr_cash_bank_dr_gl_id' => DB::raw('gl_cash_bank_id'),
                    'fdr_interest_exp_dr_gl_id' => DB::raw('gl_profit_id'),
                ]);

            DB::table('product_mst')
                ->where('product_type', 'share')
                ->update([
                    'shr_capital_cr_gl_id' => DB::raw('gl_principal_id'),
                    'shr_cash_bank_dr_gl_id' => DB::raw('gl_cash_bank_id'),
                    'shr_fee_income_cr_gl_id' => DB::raw('gl_income_id'),
                ]);

            DB::table('product_mst')
                ->where('product_type', 'loan')
                ->update([
                    'loan_portfolio_dr_gl_id' => DB::raw('COALESCE(gl_loan_outstanding_id, gl_principal_id)'),
                    'loan_cash_bank_cr_gl_id' => DB::raw('COALESCE(gl_loan_disbursement_id, gl_cash_bank_id)'),
                    'loan_interest_income_cr_gl_id' => DB::raw('COALESCE(gl_income_id, gl_profit_id)'),
                    'loan_penalty_income_cr_gl_id' => DB::raw('gl_penalty_id'),
                    'loan_waiver_exp_dr_gl_id' => DB::raw('gl_waiver_id'),
                    'loan_loss_provision_exp_dr_gl_id' => DB::raw('loan_loss_provision_gl_id'),
                ]);

            DB::table('product_mst')
                ->where('product_type', 'member_loan')
                ->update([
                    'mem_loan_portfolio_dr_gl_id' => DB::raw('COALESCE(gl_loan_outstanding_id, gl_principal_id)'),
                    'mem_loan_cash_bank_cr_gl_id' => DB::raw('COALESCE(gl_loan_disbursement_id, gl_cash_bank_id)'),
                    'mem_loan_interest_income_cr_gl_id' => DB::raw('COALESCE(gl_profit_id, gl_income_id)'),
                    'mem_loan_penalty_income_cr_gl_id' => DB::raw('gl_penalty_id'),
                    'mem_loan_waiver_exp_dr_gl_id' => DB::raw('gl_waiver_id'),
                    'mem_loan_loss_provision_exp_dr_gl_id' => DB::raw('loan_loss_provision_gl_id'),
                ]);
        }

        if (Schema::hasColumn('product_mst', 'loan_loss_provision_gl_id')) {
            try {
                DB::statement('ALTER TABLE product_mst DROP FOREIGN KEY product_mst_loan_loss_provision_gl_id_foreign');
            } catch (\Throwable $e) {
                // Ignore if the foreign key is already missing.
            }
        }

        Schema::table('product_mst', function (Blueprint $table) {
            $dropColumns = [
                'gl_principal_id',
                'gl_loan_outstanding_id',
                'gl_loan_disbursement_id',
                'gl_profit_id',
                'gl_penalty_id',
                'gl_income_id',
                'gl_expense_id',
                'gl_cash_bank_id',
                'gl_waiver_id',
                'loan_loss_provision_gl_id',
            ];

            foreach ($dropColumns as $column) {
                if (Schema::hasColumn('product_mst', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('product_mst')) {
            return;
        }

        Schema::table('product_mst', function (Blueprint $table) {
            $oldColumns = [
                'gl_principal_id',
                'gl_loan_outstanding_id',
                'gl_loan_disbursement_id',
                'gl_profit_id',
                'gl_penalty_id',
                'gl_income_id',
                'gl_expense_id',
                'gl_cash_bank_id',
                'gl_waiver_id',
                'loan_loss_provision_gl_id',
            ];

            foreach ($oldColumns as $column) {
                if (!Schema::hasColumn('product_mst', $column)) {
                    $table->unsignedBigInteger($column)->nullable();
                }
            }
        });

        DB::table('product_mst')
            ->where('product_type', 'saving')
            ->update([
                'gl_principal_id' => DB::raw('sav_dep_lib_cr_gl_id'),
                'gl_penalty_id' => DB::raw('sav_penalty_income_cr_gl_id'),
                'gl_cash_bank_id' => DB::raw('sav_cash_bank_dr_gl_id'),
                'gl_expense_id' => DB::raw('sav_cash_bank_dr_gl_id'),
                'gl_income_id' => DB::raw('sav_dep_lib_cr_gl_id'),
                'gl_profit_id' => DB::raw('sav_interest_exp_dr_gl_id'),
            ]);

        DB::table('product_mst')
            ->where('product_type', 'dps')
            ->update([
                'gl_principal_id' => DB::raw('dps_dep_lib_cr_gl_id'),
                'gl_penalty_id' => DB::raw('dps_penalty_income_cr_gl_id'),
                'gl_cash_bank_id' => DB::raw('dps_cash_bank_dr_gl_id'),
                'gl_profit_id' => DB::raw('dps_interest_exp_dr_gl_id'),
            ]);

        DB::table('product_mst')
            ->where('product_type', 'fdr')
            ->update([
                'gl_principal_id' => DB::raw('fdr_dep_lib_cr_gl_id'),
                'gl_penalty_id' => DB::raw('fdr_penalty_income_cr_gl_id'),
                'gl_cash_bank_id' => DB::raw('fdr_cash_bank_dr_gl_id'),
                'gl_profit_id' => DB::raw('fdr_interest_exp_dr_gl_id'),
            ]);

        DB::table('product_mst')
            ->where('product_type', 'share')
            ->update([
                'gl_principal_id' => DB::raw('shr_capital_cr_gl_id'),
                'gl_cash_bank_id' => DB::raw('shr_cash_bank_dr_gl_id'),
                'gl_income_id' => DB::raw('shr_fee_income_cr_gl_id'),
            ]);

        DB::table('product_mst')
            ->where('product_type', 'loan')
            ->update([
                'gl_principal_id' => DB::raw('loan_portfolio_dr_gl_id'),
                'gl_loan_outstanding_id' => DB::raw('loan_portfolio_dr_gl_id'),
                'gl_loan_disbursement_id' => DB::raw('loan_cash_bank_cr_gl_id'),
                'gl_income_id' => DB::raw('loan_interest_income_cr_gl_id'),
                'gl_penalty_id' => DB::raw('loan_penalty_income_cr_gl_id'),
                'gl_waiver_id' => DB::raw('loan_waiver_exp_dr_gl_id'),
                'loan_loss_provision_gl_id' => DB::raw('loan_loss_provision_exp_dr_gl_id'),
            ]);

        DB::table('product_mst')
            ->where('product_type', 'member_loan')
            ->update([
                'gl_principal_id' => DB::raw('mem_loan_portfolio_dr_gl_id'),
                'gl_loan_outstanding_id' => DB::raw('mem_loan_portfolio_dr_gl_id'),
                'gl_loan_disbursement_id' => DB::raw('mem_loan_cash_bank_cr_gl_id'),
                'gl_profit_id' => DB::raw('mem_loan_interest_income_cr_gl_id'),
                'gl_income_id' => DB::raw('mem_loan_interest_income_cr_gl_id'),
                'gl_penalty_id' => DB::raw('mem_loan_penalty_income_cr_gl_id'),
                'gl_waiver_id' => DB::raw('mem_loan_waiver_exp_dr_gl_id'),
                'loan_loss_provision_gl_id' => DB::raw('mem_loan_loss_provision_exp_dr_gl_id'),
            ]);

        Schema::table('product_mst', function (Blueprint $table) {
            $newColumns = [
                'sav_dep_lib_cr_gl_id',
                'sav_penalty_income_cr_gl_id',
                'sav_cash_bank_dr_gl_id',
                'sav_interest_exp_dr_gl_id',
                'dps_dep_lib_cr_gl_id',
                'dps_penalty_income_cr_gl_id',
                'dps_cash_bank_dr_gl_id',
                'dps_interest_exp_dr_gl_id',
                'fdr_dep_lib_cr_gl_id',
                'fdr_penalty_income_cr_gl_id',
                'fdr_cash_bank_dr_gl_id',
                'fdr_interest_exp_dr_gl_id',
                'shr_capital_cr_gl_id',
                'shr_cash_bank_dr_gl_id',
                'shr_fee_income_cr_gl_id',
                'loan_portfolio_dr_gl_id',
                'loan_cash_bank_cr_gl_id',
                'loan_interest_income_cr_gl_id',
                'loan_penalty_income_cr_gl_id',
                'loan_waiver_exp_dr_gl_id',
                'loan_loss_provision_exp_dr_gl_id',
                'mem_loan_portfolio_dr_gl_id',
                'mem_loan_cash_bank_cr_gl_id',
                'mem_loan_interest_income_cr_gl_id',
                'mem_loan_penalty_income_cr_gl_id',
                'mem_loan_waiver_exp_dr_gl_id',
                'mem_loan_loss_provision_exp_dr_gl_id',
            ];

            foreach ($newColumns as $column) {
                if (Schema::hasColumn('product_mst', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
