<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * La columna `documento` tenia dos significados incompatibles: primero guardaba
 * el documento del cliente y al emitir se sobreescribia con el nombre del PDF.
 * Todos los comprobantes rechazados acababan con el mismo literal
 * 'rechazado.pdf', lo que hacia que los accessors de URL apuntaran a un
 * archivo que no existe.
 *
 * A partir de aqui `documento` significa una sola cosa: el nombre del PDF
 * emitido. El documento del cliente vive en `documento_cliente`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            $table->string('documento')->nullable()->change();
        });

        DB::table('facturas')
            ->where('documento', 'rechazado.pdf')
            ->update(['documento' => null]);
    }

    public function down(): void
    {
        DB::table('facturas')
            ->whereNull('documento')
            ->update(['documento' => 'rechazado.pdf']);

        Schema::table('facturas', function (Blueprint $table) {
            $table->string('documento')->nullable(false)->change();
        });
    }
};
