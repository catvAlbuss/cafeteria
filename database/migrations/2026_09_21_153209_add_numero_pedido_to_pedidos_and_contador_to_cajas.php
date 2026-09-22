<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Número de pedido visible, secuencial dentro de la caja abierta
     * (solo alta directa en caja). Nunca se imprime en comprobantes SUNAT.
     */
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->unsignedBigInteger('numero_pedido')->nullable()->after('numero');
        });

        Schema::table('cajas', function (Blueprint $table) {
            $table->unsignedBigInteger('contador_pedidos')->default(0)->after('total_pedidos');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn('numero_pedido');
        });

        Schema::table('cajas', function (Blueprint $table) {
            $table->dropColumn('contador_pedidos');
        });
    }
};
