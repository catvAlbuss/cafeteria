<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // correlativos_control: el contador pertenece al RUC emisor, no al
        // equipo. Dos sedes con el mismo RUC deben compartir la serie o
        // emitiran numeros duplicados ante SUNAT.
        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->string('ruc', 20)->nullable()->after('serie');
            $table->string('estado', 30)->nullable()->after('ultimo_correlativo');
            $table->string('documento', 255)->nullable()->after('estado');
        });

        DB::table('correlativos_control')->update(['ruc' => config('sunat.ruc')]);

        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->dropUnique('correlativos_control_serie_unique');
        });

        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->unique(['ruc', 'serie'], 'correlativos_control_ruc_serie_unique');
        });

        // facturas: team_id permite filtrar en la UI por sede. El correlativo
        // sigue siendo global por RUC, la unicidad (serie, correlativo) no cambia.
        Schema::table('facturas', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id')->nullable()->after('idfactura');
        });

        // La unicidad de notas_credito_factura_id la maneja otra rama. Este
        // archivo solo se hace cargo de lo que le corresponde, para no romper
        // el rollback cuando esa tabla todavia no existe.
    }

    public function down(): void
    {
        if (Schema::hasTable('notas_credito') && Schema::hasIndex('notas_credito', 'notas_credito_factura_id_unique')) {
            Schema::table('notas_credito', function (Blueprint $table) {
                $table->dropUnique('notas_credito_factura_id_unique');
            });

            Schema::table('notas_credito', function (Blueprint $table) {
                $table->index('factura_id', 'notas_credito_factura_id_index');
            });
        }

        Schema::table('facturas', function (Blueprint $table) {
            $table->dropColumn('team_id');
        });

        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->dropUnique('correlativos_control_ruc_serie_unique');
        });

        Schema::table('correlativos_control', function (Blueprint $table) {
            $table->unique('serie', 'correlativos_control_serie_unique');
            $table->dropColumn(['ruc', 'estado', 'documento']);
        });
    }
};
