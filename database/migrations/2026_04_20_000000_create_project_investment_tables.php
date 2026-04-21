<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('project_declarations')) {
            Schema::create('project_declarations', function (Blueprint $table) {
                $table->id();
                $table->string('project_code')->unique();
                $table->string('project_name');
                $table->text('description')->nullable();
                $table->date('declaration_date');
                $table->decimal('total_shares', 15, 2);
                $table->decimal('share_price', 15, 2);
                $table->decimal('target_amount', 15, 2);
                $table->decimal('sold_share_qty', 15, 2)->default(0);
                $table->decimal('available_share_qty', 15, 2)->default(0);
                $table->decimal('sold_amount', 15, 2)->default(0);
                $table->unsignedBigInteger('investment_gl_id')->nullable();
                $table->unsignedBigInteger('investor_fund_gl_id')->nullable();
                $table->unsignedBigInteger('cash_gl_id')->nullable();
                $table->unsignedBigInteger('profit_distribution_gl_id')->nullable();
                $table->unsignedBigInteger('samity_income_gl_id')->nullable();
                $table->date('closing_date')->nullable();
                $table->decimal('closing_value', 15, 2)->nullable();
                $table->decimal('closing_expense', 15, 2)->default(0);
                $table->decimal('net_profit', 15, 2)->default(0);
                $table->decimal('distributable_profit', 15, 2)->default(0);
                $table->decimal('samity_income', 15, 2)->default(0);
                $table->enum('status', ['draft', 'active', 'closed', 'cancelled'])->default('draft');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->unsignedBigInteger('closed_by')->nullable();
                $table->timestamps();

                $table->index(['status', 'declaration_date'], 'proj_decl_status_dt_idx');
            });
        }

        if (!Schema::hasTable('project_investors')) {
            Schema::create('project_investors', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_declaration_id');
                $table->unsignedBigInteger('member_id');
                $table->unsignedBigInteger('samity_id')->nullable();
                $table->decimal('purchased_shares', 15, 2)->default(0);
                $table->decimal('invested_amount', 15, 2)->default(0);
                $table->decimal('profit_amount', 15, 2)->default(0);
                $table->decimal('refunded_amount', 15, 2)->default(0);
                $table->enum('status', ['active', 'closed'])->default('active');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();

                $table->foreign('project_declaration_id')->references('id')->on('project_declarations')->onDelete('cascade');
                $table->foreign('member_id')->references('id')->on('member_infos')->onDelete('cascade');
                $table->unique(['project_declaration_id', 'member_id'], 'proj_inv_proj_member_unq');
            });
        }

        if (!Schema::hasTable('project_share_transactions')) {
            Schema::create('project_share_transactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_declaration_id');
                $table->unsignedBigInteger('project_investor_id')->nullable();
                $table->unsignedBigInteger('member_id')->nullable();
                $table->date('tran_date');
                $table->enum('tran_type', ['purchase', 'profit_distribution', 'closing_refund', 'adjustment']);
                $table->decimal('share_qty', 15, 2)->default(0);
                $table->decimal('rate', 15, 2)->default(0);
                $table->decimal('amount', 15, 2)->default(0);
                $table->string('batch_num')->nullable();
                $table->text('remarks')->nullable();
                $table->string('status')->default('posted');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('project_declaration_id')->references('id')->on('project_declarations')->onDelete('cascade');
                $table->foreign('project_investor_id')->references('id')->on('project_investors')->onDelete('set null');
                $table->foreign('member_id')->references('id')->on('member_infos')->onDelete('set null');
                $table->index(['project_declaration_id', 'tran_type'], 'proj_share_proj_type_idx');
            });
        }

        if (!Schema::hasTable('project_closings')) {
            Schema::create('project_closings', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('project_declaration_id')->unique();
                $table->date('closing_date');
                $table->decimal('total_invested', 15, 2);
                $table->decimal('closing_value', 15, 2);
                $table->decimal('closing_expense', 15, 2)->default(0);
                $table->decimal('net_profit', 15, 2)->default(0);
                $table->decimal('distributable_profit', 15, 2)->default(0);
                $table->decimal('samity_income', 15, 2)->default(0);
                $table->unsignedBigInteger('total_investors')->default(0);
                $table->text('remarks')->nullable();
                $table->string('status')->default('completed');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->foreign('project_declaration_id')->references('id')->on('project_declarations')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('project_closings');
        Schema::dropIfExists('project_share_transactions');
        Schema::dropIfExists('project_investors');
        Schema::dropIfExists('project_declarations');
    }
};
