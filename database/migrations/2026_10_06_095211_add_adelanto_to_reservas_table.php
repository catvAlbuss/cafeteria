<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            if (!Schema::hasColumn('reservas', 'adelanto_monto')) {
                $table->decimal('adelanto_monto', 10, 2)->nullable()->after('personas');
                $table->string('adelanto_metodo_pago', 20)->nullable()->after('adelanto_monto');
                $table->foreignId('adelanto_caja_id')->nullable()->after('adelanto_metodo_pago')
                      ->constrained('cajas')->nullOnDelete();
                $table->timestamp('adelanto_pagado_at')->nullable()->after('adelanto_caja_id');
                $table->enum('adelanto_estado', ['pendiente', 'pagado', 'aplicado', 'perdido'])
                      ->default('pendiente')->after('adelanto_pagado_at');
                $table->timestamp('adelanto_aplicado_at')->nullable()->after('adelanto_estado');
            }
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            if (Schema::hasColumn('reservas', 'adelanto_aplicado_at')) {
                $table->dropColumn([
                    'adelanto_monto',
                    'adelanto_metodo_pago',
                    'adelanto_caja_id',
                    'adelanto_pagado_at',
                    'adelanto_estado',
                    'adelanto_aplicado_at',
                ]);
            }
        });
    }
};