<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('member_loan_transactions') && Schema::hasColumn('member_loan_transactions', 'member_loan_schedule_id')) {
            try {
                DB::statement('ALTER TABLE member_loan_transactions DROP FOREIGN KEY member_loan_transactions_member_loan_schedule_id_foreign');
            } catch (\Throwable $e) {
                // Ignore if missing.
            }

            Schema::table('member_loan_transactions', function (Blueprint $table) {
                $table->dropColumn('member_loan_schedule_id');
            });
        }

        if (Schema::hasTable('member_loan_schedules')) {
            Schema::drop('member_loan_schedules');
        }

        if (Schema::hasTable('member_loan_applications')) {
            Schema::table('member_loan_applications', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('member_loan_applications', 'scheduled_emi')) {
                    $columns[] = 'scheduled_emi';
                }
                if (Schema::hasColumn('member_loan_applications', 'installment_day')) {
                    $columns[] = 'installment_day';
                }
                if ($columns) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('member_loan_accounts') && Schema::hasColumn('member_loan_accounts', 'scheduled_emi')) {
            Schema::table('member_loan_accounts', function (Blueprint $table) {
                $table->dropColumn('scheduled_emi');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('member_loan_applications')) {
            Schema::table('member_loan_applications', function (Blueprint $table) {
                if (!Schema::hasColumn('member_loan_applications', 'scheduled_emi')) {
                    $table->decimal('scheduled_emi', 15, 2)->default(0);
                }
                if (!Schema::hasColumn('member_loan_applications', 'installment_day')) {
                    $table->unsignedTinyInteger('installment_day')->default(1);
                }
            });
        }

        if (Schema::hasTable('member_loan_accounts') && !Schema::hasColumn('member_loan_accounts', 'scheduled_emi')) {
            Schema::table('member_loan_accounts', function (Blueprint $table) {
                $table->decimal('scheduled_emi', 15, 2)->default(0);
            });
        }

        if (!Schema::hasTable('member_loan_schedules') && Schema::hasTable('member_loan_accounts')) {
            Schema::create('member_loan_schedules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('member_loan_account_id')->constrained('member_loan_accounts')->cascadeOnDelete();
                $table->unsignedInteger('schedule_no');
                $table->date('due_date');
                $table->decimal('opening_principal', 15, 2)->default(0);
                $table->decimal('scheduled_emi', 15, 2)->default(0);
                $table->decimal('scheduled_interest', 15, 2)->default(0);
                $table->decimal('scheduled_principal', 15, 2)->default(0);
                $table->decimal('accrued_interest', 15, 2)->default(0);
                $table->decimal('overdue_interest', 15, 2)->default(0);
                $table->decimal('paid_interest', 15, 2)->default(0);
                $table->decimal('paid_principal', 15, 2)->default(0);
                $table->decimal('paid_overdue_interest', 15, 2)->default(0);
                $table->decimal('closing_principal', 15, 2)->default(0);
                $table->date('last_payment_date')->nullable();
                $table->enum('status', ['pending', 'partial', 'paid', 'overdue'])->default('pending');
                $table->timestamps();

                $table->unique(['member_loan_account_id', 'schedule_no'], 'mlsch_acc_sched_unq');
                $table->index(['member_loan_account_id', 'due_date'], 'mlsch_acc_due_idx');
            });
        }

        if (Schema::hasTable('member_loan_transactions') && !Schema::hasColumn('member_loan_transactions', 'member_loan_schedule_id')) {
            Schema::table('member_loan_transactions', function (Blueprint $table) {
                $table->foreignId('member_loan_schedule_id')->nullable()->constrained('member_loan_schedules')->nullOnDelete()->after('member_loan_application_id');
            });
        }
    }
};
