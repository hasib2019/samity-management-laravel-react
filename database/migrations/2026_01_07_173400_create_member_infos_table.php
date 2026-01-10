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
        Schema::create('member_infos', function (Blueprint $table) {
            $table->id();
            $table->text('member_code')->nullable();
            $table->integer('samity_id'); // Not null
            $table->boolean('is_samity_member')->default(true);
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('occupation_id')->nullable();
            $table->integer('education_level_id')->nullable();
            $table->integer('marital_status_id')->nullable();
            $table->integer('gender_id')->nullable();
            $table->string('nid', 20)->nullable();
            $table->date('dob')->nullable();
            $table->string('member_name', 150)->nullable();
            $table->string('member_name_bangla', 150)->nullable();
            $table->string('father_name', 150)->nullable();
            $table->string('mother_name', 150)->nullable();
            $table->string('spouse_name', 150)->nullable();
            $table->string('mobile', 15)->nullable();
            $table->string('email', 100)->nullable();
            $table->char('committee_organizer', 1)->default('N');
            $table->char('committee_contact_person', 1)->default('N');
            $table->char('committee_signatory_person', 1)->default('N');
            $table->json('others_docs')->nullable();
            $table->integer('ref_samity_id')->nullable();
            $table->date('member_admission_date')->nullable();
            $table->string('brn', 25)->nullable();
            $table->integer('doptor_id')->nullable();
            $table->boolean('is_active')->nullable()->default(true);
            $table->json('documents')->nullable();
            $table->text('member_photo')->nullable();
            $table->text('member_sign')->nullable();
            $table->integer('religion_id')->nullable();
            $table->integer('share_price')->nullable();
            $table->integer('no_of_share')->nullable();
            $table->string('nid_photo')->nullable();
            $table->string('others')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_infos');
    }
};
