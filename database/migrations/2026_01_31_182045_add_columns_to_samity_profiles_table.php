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
        Schema::table('samity_profiles', function (Blueprint $table) {
            $table->date('samity_formation_date')->nullable();
            $table->string('old_registration_no')->nullable();
            $table->date('samity_registration_date')->nullable();
            $table->decimal('member_admission_fee', 10, 2)->default(0);
            $table->integer('no_of_share')->nullable();
            $table->decimal('share_price', 10, 2)->nullable();
            $table->integer('sold_share')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('mobile', 20)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('website', 150)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('samity_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'samity_formation_date',
                'old_registration_no',
                'samity_registration_date',
                'member_admission_fee',
                'no_of_share',
                'share_price',
                'sold_share',
                'phone',
                'mobile',
                'email',
                'website',
            ]);
        });
    }
};
