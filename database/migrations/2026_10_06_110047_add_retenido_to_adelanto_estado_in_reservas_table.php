<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "retenido" registra lo que pasó con el adelanto de una reserva que el
     * cliente nunca reclamó: el dinero se queda en caja y el cajero decide si
     * lo devuelve. No es un pago pendiente de aplicar, es dinero retenido.
     */
    public function up(): void
    {
        $this->cambiarEnum([
            'sin_adelanto',
            'pagado',
            'aplicado_parcial',
            'aplicado_total',
            'devuelto',
            'retenido',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('reservas')
            ->where('adelanto_estado', 'retenido')
            ->update(['adelanto_estado' => 'pagado']);

        $this->cambiarEnum([
            'sin_adelanto',
            'pagado',
            'aplicado_parcial',
            'aplicado_total',
            'devuelto',
        ]);
    }

    /**
     * @param  array<int, string>  $valores
     */
    private function cambiarEnum(array $valores): void
    {
        Schema::table('reservas', function (Blueprint $table) use ($valores) {
            $table->enum('adelanto_estado', $valores)
                ->default('sin_adelanto')
                ->change();
        });
    }
};
