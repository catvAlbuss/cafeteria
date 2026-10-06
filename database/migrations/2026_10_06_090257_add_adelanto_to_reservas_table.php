<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            // Pago mínimo (S/ 20) que entra como adelanto al crear la reserva.
            $table->decimal('adelanto_pagado', 12, 2)->default(0)->after('personas');
            $table->string('adelanto_metodo', 20)->nullable()->after('adelanto_pagado');
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->dropColumn(['adelanto_pagado', 'adelanto_metodo']);
        });
    }
};
