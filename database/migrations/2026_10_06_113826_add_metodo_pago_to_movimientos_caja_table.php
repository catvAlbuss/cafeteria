<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Método de pago con el que entró o salió el dinero. Null = efectivo,
     * que es como quedaron todas las filas antiguas: el arqueo las sigue
     * contando como efectivo para no romper la historia.
     */
    public function up(): void
    {
        Schema::table('movimientos_caja', function (Blueprint $table) {
            $table->string('metodo_pago', 20)->nullable()->after('tipo');
        });
    }

    public function down(): void
    {
        Schema::table('movimientos_caja', function (Blueprint $table) {
            $table->dropColumn('metodo_pago');
        });
    }
};
