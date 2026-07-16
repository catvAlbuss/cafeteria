<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insumos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->string('nombre');
            $table->string('categoria')->nullable();
            $table->string('unidad'); // kg, L, g, unidades
            $table->decimal('stock', 10, 2)->default(0);
            $table->decimal('precio', 10, 2)->default(0);
            $table->string('proveedor')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insumos');
    }
};