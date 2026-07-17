<?php

namespace App\Http\Middleware;

use App\Models\Caja;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOpenCashSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $teamId = $request->user()?->current_team_id;

        if (! $teamId || ! Caja::query()->where('team_id', $teamId)->where('estado', 'Abierta')->exists()) {
            $message = 'La sede está cerrada. Gerencia, administración o caja deben abrir la jornada primero.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 423);
            }

            return redirect()->back()->with('error', $message);
        }

        return $next($request);
    }
}
