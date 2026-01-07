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
        Schema::table('member_infos', function (Blueprint $table) {
            $table->string('nid_photo')->nullable()->after('member_sign');
            $table->string('others')->nullable()->after('nid_photo');
            $table->foreignId('user_id')->nullable()->after('others')->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_infos', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['nid_photo', 'others', 'user_id']);
        });
    }
};
