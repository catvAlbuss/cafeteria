<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mesas', function (Blueprint $table) {
            $table->id();
            $table->string('numero', 10)->unique();
            $table->integer('capacidad')->default(4);
            $table->integer('sillas')->default(4);
            $table->enum('estado', ['libre', 'pendiente', 'ocupada', 'reserva', 'listo_cobrar'])->default('libre');
            $table->string('cliente')->nullable();
            $table->integer('personas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mesas');
    }
};
