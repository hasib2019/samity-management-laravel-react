<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Committee Types
        Schema::create('committee_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_bn')->nullable()->comment('Bengali name');
            $table->text('description')->nullable();
            $table->integer('validity_period')->default(3)->comment('Mandate duration in years');
            $table->json('member_count_options')->default('[3, 6, 9, 12]')->comment('Available member count options');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('is_active');
        });

        // Committees
        Schema::create('committees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('samity_id');
            $table->unsignedBigInteger('committee_type_id');
            $table->string('name');
            $table->string('name_bn')->nullable();
            $table->date('meeting_date')->nullable();
            $table->date('election_date')->nullable();
            $table->date('effective_date');
            $table->date('end_date')->nullable()->comment('Auto-calculated from effective_date + validity_period');
            $table->integer('member_count')->default(3);
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('samity_id')->references('id')->on('samity_profiles')->onDelete('cascade');
            $table->foreign('committee_type_id')->references('id')->on('committee_types');
            $table->index(['samity_id', 'status']);
        });

        // Committee Members
        Schema::create('committee_members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('committee_id');
            $table->unsignedBigInteger('member_info_id');
            $table->string('designation')->comment('Chairman, Vice Chairman, Member, etc');
            $table->integer('position')->default(0)->comment('Order position in committee');
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('committee_id')->references('id')->on('committees')->onDelete('cascade');
            $table->foreign('member_info_id')->references('id')->on('member_infos')->onDelete('cascade');
            $table->unique(['committee_id', 'member_info_id']);
        });

        // Committee Documents
        Schema::create('committee_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('committee_id');
            $table->string('document_name');
            $table->string('document_type')->comment('meeting_minutes, election_record, nid_copy, etc');
            $table->string('file_path');
            $table->string('file_name');
            $table->integer('file_size')->nullable();
            $table->unsignedBigInteger('uploaded_by')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('committee_id')->references('id')->on('committees')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('set null');
        });

        // Committee Elections
        Schema::create('committee_elections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('committee_id');
            $table->date('election_date');
            $table->string('election_venue')->nullable();
            $table->integer('total_members')->nullable();
            $table->integer('total_votes_cast')->nullable();
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
            $table->text('remarks')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('committee_id')->references('id')->on('committees')->onDelete('cascade');
            $table->index(['committee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('committee_elections');
        Schema::dropIfExists('committee_documents');
        Schema::dropIfExists('committee_members');
        Schema::dropIfExists('committees');
        Schema::dropIfExists('committee_types');
    }
};
