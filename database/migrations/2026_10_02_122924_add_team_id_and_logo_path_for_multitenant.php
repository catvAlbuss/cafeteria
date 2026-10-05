<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Agregar logo_path a configuraciones_facturacion
        Schema::table('configuraciones_facturacion', function (Blueprint $table) {
            if (!Schema::hasColumn('configuraciones_facturacion', 'logo_path')) {
                $table->string('logo_path')->nullable()->after('certificado_path');
            }
        });

        // 2. Agregar team_id a facturas
        Schema::table('facturas', function (Blueprint $table) {
            if (!Schema::hasColumn('facturas', 'team_id')) {
                // Nullable para no romper las facturas antiguas
                $table->foreignId('team_id')->nullable()->after('idfactura')
                      ->constrained('teams')->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('configuraciones_facturacion', function (Blueprint $table) {
            if (Schema::hasColumn('configuraciones_facturacion', 'logo_path')) {
                $table->dropColumn('logo_path');
            }
        });

        Schema::table('facturas', function (Blueprint $table) {
            if (Schema::hasColumn('facturas', 'team_id')) {
                $table->dropForeign(['team_id']);
                $table->dropColumn('team_id');
            }
        });
    }
};