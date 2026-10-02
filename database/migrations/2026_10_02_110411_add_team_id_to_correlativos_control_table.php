<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Agregar columna team_id (nullable primero)
        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('id');
        });

        // 2. Asignar team_id = 1 a los registros existentes (SEVEN HEART)
        DB::table('correlativos_control')->update(['team_id' => 1]);

        // 3. Eliminar el unique antiguo de 'serie'
        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->dropUnique(['serie']);
        });

        // 4. Agregar el unique compuesto ['team_id', 'serie']
        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->unique(['team_id', 'serie']);
        });
    }

    public function down(): void
    {
        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->dropUnique(['team_id', 'serie']);
            $table->dropColumn('team_id');
            $table->unique(['serie']);
        });
    }
};