<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "expirada" se sustituye por "no_presentado": la reserva venció sin que
     * el cliente llegara y su adelanto permanece en caja a disposición del
     * cajero (no se devuelve automáticamente).
     *
     * El enum se abre a los dos valores, se migran los datos y se vuelve a
     * cerrar: MySQL rechaza escribir un valor que aún no está en la lista.
     */
    public function up(): void
    {
        $this->cambiarEnum(['confirmada', 'atendida', 'cancelada', 'expirada', 'no_presentado']);

        DB::table('reservas')
            ->where('estado', 'expirada')
            ->update(['estado' => 'no_presentado']);

        $this->cambiarEnum(['confirmada', 'atendida', 'cancelada', 'no_presentado']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->cambiarEnum(['confirmada', 'atendida', 'cancelada', 'expirada', 'no_presentado']);

        DB::table('reservas')
            ->where('estado', 'no_presentado')
            ->update(['estado' => 'expirada']);

        $this->cambiarEnum(['confirmada', 'atendida', 'cancelada', 'expirada']);
    }

    /**
     * @param  array<int, string>  $valores
     */
    private function cambiarEnum(array $valores): void
    {
        Schema::table('reservas', function (Blueprint $table) use ($valores) {
            $table->enum('estado', $valores)
                ->default('confirmada')
                ->change();
        });
    }
};
