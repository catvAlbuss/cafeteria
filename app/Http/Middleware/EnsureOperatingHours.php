<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOperatingHours
{
    /**
     * Block sales operations outside the sede's configured operating hours.
     * The Gerente role can always bypass this restriction.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $team = $user?->currentTeam;

        if (! $team || $user->hasRole('Gerente')) {
            return $next($request);
        }

        $ahora = now($team->zona_horaria)->format('H:i:s');

        if ($ahora < $team->hora_apertura || $ahora > $team->hora_cierre) {
            $apertura = substr($team->hora_apertura, 0, 5);
            $cierre = substr($team->hora_cierre, 0, 5);

            return redirect()->back()->with('error', "Fuera del horario operativo de la sede ({$apertura} - {$cierre}).");
        }

        return $next($request);
    }
}
