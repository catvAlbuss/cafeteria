<?php

use App\Events\MesaActualizada;
use App\Models\Reserva;
use App\Models\TeamInvitation;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    TeamInvitation::query()
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->delete();
})->daily()->description('Delete expired team invitations');

/*
 * El ciclo de las reservas no depende de que alguien abra la pantalla de
 * mesas: pasado el hora_fin la reserva pasa a "no presentado" (el adelanto se
 * queda en caja) y cada mesa entra o sale de "reserva" al entrar en su ventana.
 */
Schedule::call(function () {
    Reserva::expirarVencidas();

    foreach (Reserva::sincronizarMesasEnReserva() as $mesa) {
        broadcast(new MesaActualizada($mesa));
    }
})->everyMinute()
    ->description('Expire overdue reservations and update reserved tables')
    ->withoutOverlapping();
