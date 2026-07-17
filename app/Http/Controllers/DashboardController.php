<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Mesa;
use App\Models\Pedido;
use App\Models\TeamInvitation;
use App\Services\ProductionSummary;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, ProductionSummary $productionSummary): Response
    {
        $user = $request->user();
        $email = strtolower($user->email);

        $pendingInvitations = TeamInvitation::query()
            ->with(['inviter', 'team'])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->latest()
            ->get()
            ->map(fn (TeamInvitation $invitation) => [
                'code' => $invitation->code,
                'inviterName' => $invitation->inviter->name,
                'team' => [
                    'name' => $invitation->team->name,
                    'slug' => $invitation->team->slug,
                ],
            ]);

        $productionArea = match (true) {
            $user->hasRole('Bar') => 'bar',
            $user->hasRole('Cocinero') => 'cocina',
            default => null,
        };

        $productionAreas = $productionArea === 'bar'
            ? ['bar']
            : ['cocina', 'horno', 'postres'];

        $cashierSummary = $user->hasRole('Cajero') ? [
            'salesToday' => (float) Pedido::query()
                ->whereHas('caja', fn ($query) => $query->where('estado', 'Abierta'))
                ->where('estado', 'pagado')
                ->sum('total'),
            'transactionsToday' => Pedido::query()
                ->whereHas('caja', fn ($query) => $query->where('estado', 'Abierta'))
                ->where('estado', 'pagado')
                ->count(),
            'readyToCharge' => Pedido::query()
                ->where('estado', 'listo')
                ->count(),
            'activeTables' => Mesa::query()
                ->whereIn('estado', ['ocupada', 'listo_cobrar'])
                ->count(),
            'openRegister' => Caja::query()
                ->where('estado', 'Abierta')
                ->first(['id', 'caja', 'turno', 'monto_inicial', 'fecha_apertura']),
        ] : null;

        return Inertia::render('dashboard', [
            'pendingInvitations' => $pendingInvitations,
            'productionArea' => $productionArea,
            'productionSummary' => $productionArea
                ? $productionSummary->forTeamAndAreas((int) $user->current_team_id, $productionAreas)
                : null,
            'cashierSummary' => $cashierSummary,
        ]);
    }
}
