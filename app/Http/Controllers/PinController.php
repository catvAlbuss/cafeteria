<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PinController extends Controller
{
    /**
     * Verify an employee's PIN for quick terminal authentication.
     * Only matches active users who belong to the authenticated user's current sede.
     */
    public function verificar(Request $request)
    {
        $validated = $request->validate([
            'pin' => 'required|string|size:4',
        ]);

        $team = $request->user()->currentTeam;

        $empleado = $team?->members()
            ->active()
            ->where('pin', $validated['pin'])
            ->first();

        if (! $empleado) {
            return response()->json(['message' => 'PIN incorrecto o empleado inactivo.'], 422);
        }

        return response()->json([
            'user' => [
                'id' => $empleado->id,
                'name' => $empleado->name,
            ],
        ]);
    }
}
