<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->decimal('adelanto_pagado', 10, 2)->default(0)->after('hora_llegada');
            $table->decimal('adelanto_aplicado', 10, 2)->default(0)->after('adelanto_pagado');
            $table->timestamp('adelanto_pagado_at')->nullable()->after('adelanto_aplicado');
            $table->string('adelanto_metodo_pago', 20)->nullable()->after('adelanto_pagado_at');
            $table->foreignId('adelanto_caja_id')->nullable()->after('adelanto_metodo_pago')->constrained('cajas')->nullOnDelete();
            $table->foreignId('adelanto_pagado_por')->nullable()->after('adelanto_caja_id')->constrained('users')->nullOnDelete();
            $table->enum('adelanto_estado', ['sin_adelanto', 'pagado', 'aplicado_parcial', 'aplicado_total', 'devuelto'])->default('sin_adelanto')->after('adelanto_pagado_por');
        });
    }

    public function down(): void
    {
        Schema::table('reservas', function (Blueprint $table) {
            $table->dropForeign(['adelanto_caja_id']);
            $table->dropForeign(['adelanto_pagado_por']);
            $table->dropColumn([
                'adelanto_pagado',
                'adelanto_aplicado',
                'adelanto_pagado_at',
                'adelanto_metodo_pago',
                'adelanto_caja_id',
                'adelanto_pagado_por',
                'adelanto_estado',
            ]);
        });
    }
};
