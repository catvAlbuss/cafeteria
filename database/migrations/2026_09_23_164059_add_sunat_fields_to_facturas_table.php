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
        Schema::table('facturas', function (Blueprint $table) {
            if (! Schema::hasColumn('facturas', 'Cliente')) {
                $table->string('Cliente')->nullable()->after('fecha_emitido');
            }

            if (! Schema::hasColumn('facturas', 'estado_sunat')) {
                $table->string('estado_sunat', 30)->nullable()->after('documento');
            }

            if (! Schema::hasColumn('facturas', 'error_sunat')) {
                $table->text('error_sunat')->nullable()->after('estado_sunat');
            }

            if (! Schema::hasColumn('facturas', 'codigo_sunat')) {
                $table->string('codigo_sunat', 50)->nullable()->after('error_sunat');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            foreach (['codigo_sunat', 'error_sunat', 'estado_sunat', 'Cliente'] as $column) {
                if (Schema::hasColumn('facturas', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
