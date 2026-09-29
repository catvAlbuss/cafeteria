<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('pedidos')
            ->where('estado', 'pendiente_emision')
            ->update(['estado' => 'pendiente']);

        Schema::table('pedidos', function (Blueprint $table) {
            $table->enum('estado', [
                'pendiente',
                'preparando',
                'listo',
                'entregado',
                'pagado',
                'cancelado',
                'pendiente_emision',
            ])->default('pendiente')->change();
        });
    }

    public function down(): void
    {
        DB::table('pedidos')
            ->where('estado', 'pendiente_emision')
            ->update(['estado' => 'pendiente']);

        Schema::table('pedidos', function (Blueprint $table) {
            $table->enum('estado', [
                'pendiente',
                'preparando',
                'listo',
                'entregado',
                'pagado',
                'cancelado',
            ])->default('pendiente')->change();
        });
    }
};
