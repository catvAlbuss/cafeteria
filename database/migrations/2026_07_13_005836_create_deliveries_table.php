<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('cliente');
            $table->string('telefono');
            $table->string('direccion');
            $table->json('productos');
            $table->decimal('total', 10, 2);
            $table->string('metodo_pago')->nullable();
            $table->enum('estado', ['pendiente', 'pagado'])->default('pendiente');
            $table->string('estado_delivery', 50)->default('pendiente');
            $table->string('repartidor')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};  