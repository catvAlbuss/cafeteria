<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cajas', function (Blueprint $table) {
            $table->string('empleado', 100)->nullable()->change();
            $table->string('origen_fondo', 20)->default('manual')->after('monto_inicial');
            $table->text('justificacion_apertura')->nullable()->after('origen_fondo');
            $table->foreignId('closed_by')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->decimal('efectivo_esperado', 12, 2)->nullable()->after('monto_final');
            $table->decimal('diferencia_cierre', 12, 2)->nullable()->after('efectivo_esperado');
            $table->json('resumen_cierre')->nullable()->after('detalle_pedidos');
            $table->index(['team_id', 'estado'], 'cajas_team_estado_index');
        });

        Schema::create('movimientos_caja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('caja_id')->constrained('cajas')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->enum('tipo', ['ingreso', 'egreso', 'retiro', 'aporte']);
            $table->string('concepto');
            $table->decimal('monto', 12, 2);
            $table->timestamps();
            $table->index(['caja_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos_caja');

        Schema::table('cajas', function (Blueprint $table) {
            $table->dropIndex('cajas_team_estado_index');
            $table->dropConstrainedForeignId('closed_by');
            $table->dropColumn([
                'origen_fondo', 'justificacion_apertura', 'efectivo_esperado',
                'diferencia_cierre', 'resumen_cierre',
            ]);
        });
    }
};
