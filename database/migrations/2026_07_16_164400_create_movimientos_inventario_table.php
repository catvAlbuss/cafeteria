<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();

            // Item afectado: 'plato' o 'insumo'
            $table->string('item_type'); // 'plato' o 'insumo'
            $table->unsignedBigInteger('item_id');

            $table->enum('tipo', ['entrada', 'salida']);
            $table->decimal('cantidad', 10, 2);
            $table->decimal('stock_resultante', 10, 2);

            // Motivo del movimiento
            $table->enum('motivo', ['venta', 'merma', 'compra', 'ajuste', 'produccion']);

            // Referencia (pedido, merma, etc)
            $table->string('referencia_type')->nullable();
            $table->unsignedBigInteger('referencia_id')->nullable();

            $table->string('proveedor')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('observaciones')->nullable();

            $table->timestamps();

            $table->index(['team_id', 'item_type', 'item_id']);
            $table->index(['team_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_inventario');
    }
};