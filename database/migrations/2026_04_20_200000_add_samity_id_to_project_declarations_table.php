<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_declarations', function (Blueprint $table) {
            if (!Schema::hasColumn('project_declarations', 'samity_id')) {
                $table->unsignedBigInteger('samity_id')->nullable()->after('project_name');
                $table->index('samity_id');
            }
        });

        if (Schema::hasTable('project_investors')) {
            $projectSamities = DB::table('project_investors')
                ->select('project_declaration_id', DB::raw('MIN(samity_id) as samity_id'))
                ->whereNotNull('samity_id')
                ->groupBy('project_declaration_id')
                ->get();

            foreach ($projectSamities as $projectSamity) {
                DB::table('project_declarations')
                    ->where('id', $projectSamity->project_declaration_id)
                    ->whereNull('samity_id')
                    ->update(['samity_id' => $projectSamity->samity_id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('project_declarations', function (Blueprint $table) {
            if (Schema::hasColumn('project_declarations', 'samity_id')) {
                $table->dropIndex(['samity_id']);
                $table->dropColumn('samity_id');
            }
        });
    }
};
