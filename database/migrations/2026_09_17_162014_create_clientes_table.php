<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('tipo_documento', 5)->nullable()->default(null);
            $table->string('documento', 15)->nullable();
            $table->string('nombre');
            $table->string('telefono', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('direccion')->nullable();
            $table->enum('estado', ['inactivo', 'activo', 'vip'])->default('inactivo');
            $table->dateTime('ultima_visita')->nullable();
            $table->unsignedInteger('pedidos_total')->default(0);
            $table->unsignedInteger('pedidos_30d')->default(0);
            $table->decimal('total_gastado_30d', 10, 2)->default(0);
            $table->decimal('total_gastado', 10, 2)->default(0);
            $table->timestamps();

            $table->unique(['team_id', 'tipo_documento', 'documento'], 'clientes_documento_unique');
            $table->index(['team_id', 'estado']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clientes');
    }
};
