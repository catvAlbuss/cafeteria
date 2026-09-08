<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cajas', function (Blueprint $table) {
            $table->id();
            $table->string('caja', 50)->default('Caja 01');
            $table->string('empleado', 100);
            $table->enum('turno', ['Mañana', 'Tarde', 'Noche'])->default('Mañana');
            $table->decimal('monto_inicial', 10, 2)->default(0);
            $table->timestamp('fecha_apertura')->useCurrent();
            $table->decimal('monto_final', 10, 2)->nullable();
            $table->decimal('ventas_dia', 10, 2)->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamp('fecha_cierre')->nullable();
            $table->enum('estado', ['Abierta', 'Cerrada'])->default('Abierta');
            
            // Campos para sincronización
            $table->decimal('total_ventas_caja', 10, 2)->default(0);
            $table->decimal('total_deliverys', 10, 2)->default(0);
            $table->decimal('total_pedidos_mesa', 10, 2)->default(0);
            $table->integer('total_pedidos')->default(0);
            $table->json('detalle_pedidos')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cajas');
    }
};