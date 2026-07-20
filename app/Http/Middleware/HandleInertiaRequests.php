<?php

namespace App\Http\Middleware;

use App\Enums\TeamRole;
use App\Models\Caja;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
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

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'roles' => fn () => $user?->getRoleNames() ?? [],
                'permissions' => fn () => $user?->getAllPermissions()->pluck('name') ?? [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user && ($user->hasRole('Gerente') || ($user->currentTeam && in_array($user->teamRole($user->currentTeam), [TeamRole::Owner, TeamRole::Admin], true)))
                ? $user->toUserTeams(includeCurrent: true)
                : [],
            'jornadaCaja' => fn () => $user?->current_team_id ? [
                'abierta' => Caja::query()->where('estado', 'Abierta')->exists(),
                'puedeAbrir' => $user->can('manage-cash-session'),
            ] : ['abierta' => false, 'puedeAbrir' => false],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'aviso_capacidad' => fn () => $request->session()->get('aviso_capacidad'),
            ],
        ];
    }
}
