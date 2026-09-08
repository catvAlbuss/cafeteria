<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Las pantallas de mesas, ventas, caja y el dashboard filtran constantemente
        // por 'estado' (mesas ocupadas, pedidos pendientes, caja abierta). Sin índice,
        // cada una de esas consultas hace un table scan completo — se nota más
        // cuanto más crecen pedidos/mesas y con muchos usuarios consultando a la vez.
        Schema::table('mesas', function (Blueprint $table) {
            $table->index('estado');
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->index('estado');
            $table->index(['mesa_id', 'estado']);
            $table->index(['caja_id', 'estado']);
        });

        Schema::table('cajas', function (Blueprint $table) {
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::table('mesas', function (Blueprint $table) {
            $table->dropIndex(['estado']);
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropIndex(['estado']);
            $table->dropIndex(['mesa_id', 'estado']);
            $table->dropIndex(['caja_id', 'estado']);
        });

        Schema::table('cajas', function (Blueprint $table) {
            $table->dropIndex(['estado']);
        });
    }
};
