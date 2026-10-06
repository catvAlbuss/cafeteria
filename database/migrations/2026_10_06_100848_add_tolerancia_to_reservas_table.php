<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            // Tolerancia de llegada en minutos (default 20)
            if (!Schema::hasColumn('reservas', 'tolerancia_minutos')) {
                $table->integer('tolerancia_minutos')->default(20)->after('hora_fin');
            }

            // Hora límite de llegada (hora_inicio + tolerancia)
            if (!Schema::hasColumn('reservas', 'hora_limite_llegada')) {
                $table->time('hora_limite_llegada')->nullable()->after('tolerancia_minutos');
            }

            // Hacer hora_fin opcional (nullable)
            if (Schema::hasColumn('reservas', 'hora_fin')) {
                $table->string('hora_fin', 5)->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            if (Schema::hasColumn('reservas', 'hora_limite_llegada')) {
                $table->dropColumn('hora_limite_llegada');
            }

            if (Schema::hasColumn('reservas', 'tolerancia_minutos')) {
                $table->dropColumn('tolerancia_minutos');
            }

            // Volver hora_fin a NOT NULL (CUIDADO: solo si no hay filas con null)
            if (Schema::hasColumn('reservas', 'hora_fin')) {
                $table->string('hora_fin', 5)->nullable(false)->change();
            }
        });
    }
};