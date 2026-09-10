<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('mesa_id')->nullable()->constrained('mesas')->nullOnDelete();
            $table->string('cliente')->nullable();
            $table->json('productos');
            $table->decimal('total', 10, 2);
            $table->enum('estado', ['pendiente', 'preparando', 'listo', 'entregado', 'pagado', 'cancelado'])->default('pendiente');
            $table->string('observaciones')->nullable();
            $table->timestamp('hora_pedido')->useCurrent();
            $table->timestamp('hora_entrega')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
