<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Tablero de producción (cocina/bar/jugos): solo miembros de la sede que pueden ver comandas
Broadcast::channel('sede.{teamId}.produccion', function (User $user, int $teamId) {
    return (int) $user->current_team_id === $teamId && $user->can('visualizar comandas');
});

// Estado general de pedidos dentro de la sede
Broadcast::channel('sede.{teamId}.pedidos', function (User $user, int $teamId) {
    return (int) $user->current_team_id === $teamId;
});

// Salón: notifica al mesero que un pedido está listo para servir
Broadcast::channel('sede.{teamId}.salon', function (User $user, int $teamId) {
    return (int) $user->current_team_id === $teamId && $user->can('crear pedidos');
});

// Caja: dashboard del cajero
Broadcast::channel('sede.{teamId}.caja', function (User $user, int $teamId) {
    return (int) $user->current_team_id === $teamId;
});

// Mapa de mesas en tiempo real
Broadcast::channel('sede.{teamId}.mesas', function (User $user, int $teamId) {
    return (int) $user->current_team_id === $teamId;
});
