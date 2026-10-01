<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSunatAuthorization
{
    /**
     * Las rutas de emisión y descarga SUNAT quedan reservadas a Caja,
     * Administración o Gerencia, igual que la confirmación de pagos. Sin esto
     * cualquier usuario autenticado (por ejemplo un mozo) podría emitir
     * comprobantes saltándose el control de la caja.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasPermissionTo('procesar pagos')) {
            $message = 'No tienes permisos para operar facturación electrónica.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 403);
            }

            return redirect()->back()->with('error', $message);
        }

        return $next($request);
    }
}
