<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('mesa_id')->constrained('mesas')->cascadeOnDelete();
            $table->date('fecha');
            $table->string('hora_inicio', 5);
            $table->string('hora_fin', 5);
            $table->string('cliente');
            $table->string('telefono', 30)->nullable();
            $table->integer('personas');
            $table->string('notas')->nullable();
            $table->enum('estado', ['confirmada', 'atendida', 'cancelada', 'expirada'])->default('confirmada');
            $table->dateTime('fecha_cancelacion')->nullable();
            $table->string('motivo_cancelacion')->nullable();
            $table->foreignId('cancelada_por')->nullable()->constrained('users')->nullOnDelete();
            $table->string('hora_llegada', 5)->nullable();

            $table->index(['mesa_id', 'fecha']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservas');
    }
};
