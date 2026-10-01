<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La columna `documento` de `facturas` guarda el nombre del PDF emitido, asi
 * que no puede usarse tambien para el documento del cliente: al emitir se
 * sobreescribia y el RUC/DNI se perdia.
 *
 * `documento_cliente` guarda el documento del cliente de forma estable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            $table->string('documento_cliente', 20)->nullable()->after('Cliente');
        });
    }

    public function down(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            $table->dropColumn('documento_cliente');
        });
    }
};
