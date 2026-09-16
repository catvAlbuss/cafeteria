<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facturas', function (Blueprint $table) {
            $table->id('idfactura');
            $table->string('serie', 20);
            $table->string('correlativo', 255);
            $table->string('vendedor');
            $table->decimal('montototal', 10, 2);
            $table->dateTime('fecha_emitido');
            $table->boolean('factura')->default(0);
            $table->boolean('boleta')->default(0);
            $table->string('documento', 255);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facturas');
    }
};