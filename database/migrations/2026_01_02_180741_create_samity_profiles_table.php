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
        Schema::create('samity_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('samity_name');
            $table->string('samity_code')->unique();
            $table->text('samity_address');
            $table->string('samity_type')->default('P');
            $table->decimal('monthly_subscription_fee', 10, 2)->default(1000);
            $table->decimal('penalty_amount', 10, 2)->default(100);
            $table->integer('penalty_late_date')->default(15);
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
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('samity_profiles');
    }
};
