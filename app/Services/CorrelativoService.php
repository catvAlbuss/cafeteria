<?php

namespace App\Services;

use App\Models\Factura;
use Illuminate\Support\Facades\DB;

class CorrelativoService
{
    /**
     * Reserva el siguiente correlativo de una serie de forma segura ante
     * emisiones concurrentes, usando la tabla correlativos_control como
     * contador oficial con bloqueo de fila.
     *
     * El numero se quema antes de enviar a SUNAT. Un correlativo reservado
     * nunca se reutiliza, incluso si el documento acaba rechazado o si la
     * respuesta de SUNAT se pierde: reutilizarlo provoke el rechazo por
     * documento duplicado y deja la serie inutilizable.
     */
    public function siguiente(string $serie): int
    {
        $ruc = config('sunat.ruc');

        return DB::transaction(function () use ($serie, $ruc) {
            $ultimoActual = $this->ultimoConBloqueo($ruc, $serie);

            $nuevoCorrelativo = $ultimoActual + 1;

            DB::table('correlativos_control')
                ->where('ruc', $ruc)
                ->where('serie', $serie)
                ->update([
                    'ultimo_correlativo' => $nuevoCorrelativo,
                    'estado' => 'procesando',
                    'documento' => null,
                    'updated_at' => now(),
                ]);

            return $nuevoCorrelativo;
        });
    }

    /**
     * Registra el desenlace del correlativo reservado para que quede
     * documentado por que se consumio el numero.
     */
    public function registrarEstado(string $serie, string $estado, ?string $documento = null): void
    {
        DB::table('correlativos_control')
            ->where('ruc', config('sunat.ruc'))
            ->where('serie', $serie)
            ->update([
                'estado' => $estado,
                'documento' => $documento,
                'updated_at' => now(),
            ]);
    }

    /**
     * Devuelve el estado actual de una serie sin reservarla, para mostrar en
     * pantalla el proximo numero disponible.
     */
    public function proximo(string $serie): int
    {
        $control = DB::table('correlativos_control')
            ->where('ruc', config('sunat.ruc'))
            ->where('serie', $serie)
            ->first();

        return $control ? (int) $control->ultimo_correlativo + 1 : 1;
    }

    /**
     * Siembra el contador de una serie a partir del correlativo mas alto ya
     * existente en la tabla de facturas. Se usa al migrar datos anteriores a
     * la tabla de control para no repetir numeros ante SUNAT.
     */
    public function sembrarDesdeFacturas(string $serie): void
    {
        $ruc = config('sunat.ruc');

        DB::transaction(function () use ($serie, $ruc) {
            $existe = DB::table('correlativos_control')
                ->where('ruc', $ruc)
                ->where('serie', $serie)
                ->lockForUpdate()
                ->first();

            if ($existe) {
                return;
            }

            $ultimoCorrelativo = (int) (Factura::where('serie', $serie)
                ->pluck('correlativo')
                ->max(fn ($correlativo) => (int) $correlativo) ?? 0);

            DB::table('correlativos_control')->insert([
                'ruc' => $ruc,
                'serie' => $serie,
                'ultimo_correlativo' => $ultimoCorrelativo,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    /**
     * Devuelve el ultimo correlativo de la serie con la fila bloqueada. Si la
     * serie aun no existe la crea en 0: el INSERT ya toma un bloqueo
     * exclusivo sobre la fila nueva, asi que no hace falta releerla.
     * Se llama siempre dentro de una transaccion.
     */
    private function ultimoConBloqueo(string $ruc, string $serie): int
    {
        $control = DB::table('correlativos_control')
            ->where('ruc', $ruc)
            ->where('serie', $serie)
            ->lockForUpdate()
            ->first();

        if ($control === null) {
            DB::table('correlativos_control')->insert([
                'ruc' => $ruc,
                'serie' => $serie,
                'ultimo_correlativo' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return 0;
        }

        return (int) $control->ultimo_correlativo;
    }
}
