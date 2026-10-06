<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notas_credito', function (Blueprint $table) {
            if (!Schema::hasColumn('notas_credito', 'team_id')) {
                $table->foreignId('team_id')->nullable()->after('id')
                      ->constrained('teams')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('notas_credito', function (Blueprint $table) {
            if (Schema::hasColumn('notas_credito', 'team_id')) {
                $table->dropForeign(['team_id']);
                $table->dropColumn('team_id');
            }
        });
    }
};