<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('covers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->nullable()->constrained('teams')->cascadeOnDelete();
            $table->string('titulo');
            $table->text('descripcion');
            $table->enum('tipo', ['promocion', 'evento', 'festividad', 'temporada']);
            $table->enum('estado', ['activo', 'programado', 'finalizado', 'pausado'])->default('programado');
            $table->text('imagen')->nullable();
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->unsignedInteger('clicks')->default(0);
            $table->string('categoria')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('covers');
    }
};
