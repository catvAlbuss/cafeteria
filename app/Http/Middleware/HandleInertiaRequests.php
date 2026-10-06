<?php

namespace App\Http\Middleware;

use App\Enums\TeamRole;
use App\Models\Caja;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function onVersionChange(Request $request, Response $response): Response
    {
        $response = parent::onVersionChange($request, $response);
        $response->headers->set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');
        $response->headers->set('Vary', 'X-Inertia, Accept-Encoding');

        return $response;
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [

                'user' => fn () => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'current_team_id' => $user->current_team_id,
                ] : null,
                'roles' => fn () => $user?->getRoleNames() ?? [],
                'permissions' => fn () => $user?->getAllPermissions()->pluck('name') ?? [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',

            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,

            'teams' => fn () => $user && ($user->hasRole('Gerente') || ($user->currentTeam && in_array($user->teamRole($user->currentTeam), [TeamRole::Owner, TeamRole::Admin], true)))
                ? $user->toUserTeams(includeCurrent: true)
                : [],

            'jornadaCaja' => fn () => $user?->current_team_id ? [
                'abierta' => Caja::where('team_id', $user->current_team_id)
                    ->where('estado', 'Abierta')
                    ->exists(),
                'puedeAbrir' => $user->can('manage-cash-session'),
            ] : ['abierta' => false, 'puedeAbrir' => false],

            'pendientesProduccion' => fn () => $this->pendientesProduccion($user),

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'aviso_capacidad' => fn () => $request->session()->get('aviso_capacidad'),
                'pedido_id' => fn () => $request->session()->get('pedido_id'),
            ],
        ];
    }

    /**
     * Contadores de pedidos pendientes/preparando por área de producción,
     * para el puntito del sidebar. Solo con permisos de ver, y solo si hay
     * una sede activa.
     */
    private function pendientesProduccion(?User $user): array
    {
        if (! $user || ! $user->current_team_id) {
            return ['cocina' => 0, 'bar' => 0];
        }

        $base = Pedido::query()
            ->where('team_id', $user->current_team_id)
            ->whereNull('delivery_id')
            ->whereIn('estado', ['pendiente', 'preparando']);

        $cocina = $user->can('ver cocina')
            ? (clone $base)->whereIn('area', ['cocina', 'horno', 'postres'])->count()
            : 0;
        $bar = $user->can('ver bar')
            ? (clone $base)->where('area', 'bar')->count()
            : 0;

        return ['cocina' => $cocina, 'bar' => $bar];
    }
}
