<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            // Agrupa varios "Pedido" (tickets por producto/área) que se cobraron
            // juntos como una sola cuenta/mesa, para poder mostrarlos como una
            // sola venta en los reportes.
            $table->uuid('venta_grupo')->nullable()->after('caja_id');
            $table->index('venta_grupo');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropIndex(['venta_grupo']);
            $table->dropColumn('venta_grupo');
        });
    }
};