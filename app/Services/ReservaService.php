<?php

namespace App\Services;

use App\Events\ReservaActualizada;
use App\Models\Caja;
use App\Models\Mesa;
use App\Models\MovimientoCaja;
use App\Models\Pedido;
use App\Models\Reserva;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReservaService
{
    /**
     * Marca la reserva activa de una mesa como atendida (el cliente llegó y
     * se toma el pedido). Devuelve la reserva atendida o null si no hay.
     *
     * La llegada es real solo si la mesa ya estaba pintada como "reserva":
     * sentarse en una mesa libre u ocupada no confirma la asistencia de nadie.
     *
     * @param  string  $estadoAnteriorDeMesa  estado de la mesa antes de sentarse
     */
    public static function atenderActiva(Mesa $mesa, string $estadoAnteriorDeMesa): ?Reserva
    {
        if ($estadoAnteriorDeMesa !== 'reserva') {
            return null;
        }

        $activa = Reserva::activaDeMesa($mesa->id);

        if (! $activa) {
            return null;
        }

        $activa->update([
            'estado' => Reserva::ESTADO_ATENDIDA,
            'hora_llegada' => now()->format('H:i'),
        ]);

        ReservaActualizada::dispatch($activa->fresh());

        return $activa;
    }

    /**
     * Punto único por el que una mesa que acaba de quedar libre decide su
     * estado: pasa a "reserva" con los datos del cliente si hay una reserva
     * activa en la ventana de anticipación, o se queda "libre".
     *
     * Las mesas en uso (ocupada, pendiente, listo_cobrar) no se tocan: nunca
     * se pisan los datos del cliente que ya está sentado ahí.
     *
     * Devuelve true si el estado de la mesa cambió.
     */
    public static function aplicarReservaActiva(Mesa $mesa): bool
    {
        if (! in_array($mesa->estado, ['libre', 'reserva'], true)) {
            return false;
        }

        $estadoAnterior = $mesa->estado;
        $activa = Reserva::activaDeMesa($mesa->id);

        $mesa->estado = $activa ? 'reserva' : 'libre';
        $mesa->cliente = $activa?->cliente;
        $mesa->personas = $activa?->personas;

        if ($mesa->isDirty()) {
            $mesa->save();
        }

        return $mesa->estado !== $estadoAnterior;
    }

    /**
     * Aplica a la venta recién cobrada el adelanto de la reserva atendida de
     * la mesa: marca la reserva como aplicada y vincula los pedidos cobrados
     * con la reserva (auditoría de qué dinero se usó y contra qué boleta).
     *
     * El total del pedido NO se toca: SUNAT factura el consumo real.
     *
     * Si la cuenta es menor que el adelanto, solo se aplica lo consumido y el
     * sobrante vuelve al cliente: la reserva queda "aplicado_parcial" y el
     * cajero devuelve la diferencia en mano. El arqueo cuadra solo:
     *
     * - Adelanto de LA caja actual: al pasar de "pagado" a "aplicado_parcial"
     *   sale entero de la línea de adelantos; lo devuelto es justo la
     *   diferencia (−20 + 7,50 + vuelto 12,50 = −12,50 en el cajón).
     * - Adelanto heredado de otra jornada (en el fondo): el aplicado deja un
     *   egreso y el sobrante otro, para que el fondo baje exactamente lo que
     *   sale del cajón.
     *
     * @param  iterable<Pedido>  $pedidosCobrados
     */
    public static function aplicarAdelanto(
        Mesa $mesa,
        Caja $caja,
        User $usuario,
        iterable $pedidosCobrados,
    ): ?Reserva {
        $pedidos = collect($pedidosCobrados);

        return DB::transaction(function () use ($mesa, $caja, $usuario, $pedidos) {
            $reserva = Reserva::query()
                ->where('mesa_id', $mesa->id)
                ->whereDate('fecha', now()->toDateString())
                ->where('estado', Reserva::ESTADO_ATENDIDA)
                ->where('adelanto_estado', Reserva::ADELANTO_PAGADO)
                ->where('adelanto_pagado', '>', 0)
                ->orderBy('hora_inicio')
                ->lockForUpdate()
                ->first();

            if (! $reserva) {
                return null;
            }

            $adelantoPagado = round((float) $reserva->adelanto_pagado, 2);
            $totalConsumido = round((float) $pedidos->sum('total'), 2);
            $montoAplicar = round(min($adelantoPagado, $totalConsumido), 2);
            $sobrante = round($adelantoPagado - $montoAplicar, 2);

            if (self::noEstaEnCaja($reserva, $caja)) {
                $numeros = $pedidos
                    ->map(fn (Pedido $pedido) => '#'.($pedido->numero ?? $pedido->numero_pedido ?? $pedido->id))
                    ->implode(', ');

                if ($montoAplicar > 0) {
                    $rotulo = $pedidos->count() > 1 ? 'pedidos ' : 'pedido ';

                    MovimientoCaja::query()->create([
                        'team_id' => $reserva->team_id,
                        'caja_id' => $caja->id,
                        'user_id' => $usuario->id,
                        'tipo' => 'egreso',
                        'metodo_pago' => $reserva->adelanto_metodo_pago,
                        'concepto' => "Adelanto de reserva aplicado — {$rotulo}{$numeros}",
                        'monto' => $montoAplicar,
                    ]);
                }

                if ($sobrante > 0) {
                    MovimientoCaja::query()->create([
                        'team_id' => $reserva->team_id,
                        'caja_id' => $caja->id,
                        'user_id' => $usuario->id,
                        'tipo' => 'egreso',
                        'metodo_pago' => $reserva->adelanto_metodo_pago,
                        'concepto' => "Vuelto de sobrante de adelanto — reserva #{$reserva->id} ({$reserva->cliente})",
                        'monto' => $sobrante,
                    ]);
                }
            }

            $reserva->update([
                'adelanto_aplicado' => $montoAplicar,
                'adelanto_estado' => $sobrante > 0
                    ? Reserva::ADELANTO_APLICADO_PARCIAL
                    : Reserva::ADELANTO_APLICADO_TOTAL,
            ]);

            $pedidos->each(
                fn (Pedido $pedido) => $pedido->forceFill(['reserva_id' => $reserva->id])->save()
            );

            return $reserva->fresh();
        });
    }

    /**
     * Devuelve a la caja un adelanto que todavía está ahí (pagado y sin
     * aplicar, o retenido de una reserva no presentada) y marca la reserva
     * como devuelta.
     *
     * Igual que al aplicar: si el adelanto está contado en la línea de la
     * caja actual, basta con que salga de ella (pagado/retenido → devuelto)
     * para que arqueo y cajón bajen juntos. Solo el dinero heredado de una
     * jornada cerrada necesita un egreso explícito.
     */
    public static function devolverAdelanto(Reserva $reserva, Caja $caja, User $usuario): void
    {
        if (self::noEstaEnCaja($reserva, $caja)) {
            MovimientoCaja::query()->create([
                'team_id' => $reserva->team_id,
                'caja_id' => $caja->id,
                'user_id' => $usuario->id,
                'tipo' => 'egreso',
                'metodo_pago' => $reserva->adelanto_metodo_pago,
                'concepto' => "Devolución de adelanto — reserva #{$reserva->id} ({$reserva->cliente})",
                'monto' => $reserva->adelanto_pagado,
            ]);
        }

        $reserva->update([
            'adelanto_estado' => Reserva::ADELANTO_DEVUELTO,
        ]);
    }

    /**
     * true si el dinero de este adelanto NO está contado en la línea de
     * adelantos de la caja indicada, es decir, fue cobrado en otra jornada y
     * su saldo viaja heredado en el monto inicial de esta.
     */
    private static function noEstaEnCaja(Reserva $reserva, Caja $caja): bool
    {
        return (int) $reserva->adelanto_caja_id !== (int) $caja->id;
    }
}
