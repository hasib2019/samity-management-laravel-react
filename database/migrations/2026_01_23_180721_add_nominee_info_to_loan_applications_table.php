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
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->enum('nominee_type', ['member', 'external'])->default('external')->after('remarks');
            
            // For Member Nominee
            $table->foreignId('nominee_member_id')->nullable()->after('nominee_type')->constrained('member_infos');
            
            // For External Nominee (or Member fallback)
            $table->string('nominee_name')->nullable()->after('nominee_member_id');
            $table->string('nominee_relation')->nullable()->after('nominee_name');
            $table->date('nominee_dob')->nullable()->after('nominee_relation');
            $table->string('nominee_nid')->nullable()->after('nominee_dob');
            
            // Documents
            $table->string('nominee_image')->nullable()->after('nominee_nid');
            $table->string('nominee_sign')->nullable()->after('nominee_image');
            $table->string('nominee_nid_image')->nullable()->after('nominee_sign');
            $table->string('other_documents')->nullable()->after('nominee_nid_image'); // Can store JSON or path
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->dropForeign(['nominee_member_id']);
            $table->dropColumn([
                'nominee_type',
                'nominee_member_id',
                'nominee_name',
                'nominee_relation',
                'nominee_dob',
                'nominee_nid',
                'nominee_image',
                'nominee_sign',
                'nominee_nid_image',
                'other_documents'
            ]);
        });
    }
};
