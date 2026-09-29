<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE pedidos MODIFY estado ENUM(
            'pendiente',
            'preparando',
            'listo',
            'entregado',
            'pagado',
            'cancelado',
            'pendiente_emision'
        ) NOT NULL DEFAULT 'pendiente'");
    }

    public function down(): void
    {
        // Antes de revertir, actualizar cualquier registro con el nuevo estado
        DB::table('pedidos')
            ->where('estado', 'pendiente_emision')
            ->update(['estado' => 'pendiente']);

        DB::statement("ALTER TABLE pedidos MODIFY estado ENUM(
            'pendiente',
            'preparando',
            'listo',
            'entregado',
            'pagado',
            'cancelado'
        ) NOT NULL DEFAULT 'pendiente'");
    }
};