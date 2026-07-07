<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Ruta principal → Login
Route::inertia('/', 'auth/login')->name('home');

// Dashboard sin equipo (RUTA NUEVA)
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('platos', PlatoController::class);
});

// Rutas que requieren equipo (opcional)
Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        // Route::get('dashboard', DashboardController::class)->name('dashboard'); // COMENTADA
    });

Route::middleware(['auth'])->group(function () {
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

// RUTAS SIN EQUIPO (Dashboard y todas las páginas)
Route::middleware(['auth'])->group(function () {

    //  Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    //  DINERO
    Route::get('/caja', fn() => Inertia::render('dinero/caja'))->name('caja');
    Route::get('/ventas', fn() => Inertia::render('dinero/ventas'))->name('ventas');
    Route::get('/reportes', fn() => Inertia::render('dinero/reportes'))->name('reportes');
    Route::get('/contador', fn() => Inertia::render('dinero/contador'))->name('contador');

    // RESTAURANTE
    Route::get('/platos', fn() => Inertia::render('restaurante/platos'))->name('platos');
    Route::get('/mesas', fn() => Inertia::render('restaurante/mesas'))->name('mesas');
    Route::get('/mesas/distribucion', fn() => Inertia::render('restaurante/mesas-distribucion'))->name('mesas.distribucion');
    Route::get('/covers', fn() => Inertia::render('restaurante/covers'))->name('covers');

    //  INVENTARIO
    Route::get('/produccion', fn() => Inertia::render('inventario/produccion'))->name('produccion');
    Route::get('/cardex', fn() => Inertia::render('inventario/cardex'))->name('cardex');
    Route::get('/mermas', fn() => Inertia::render('inventario/mermas'))->name('mermas');
    Route::get('/etiquetas', fn() => Inertia::render('inventario/etiquetas'))->name('etiquetas');

    //  CLIENTES
    Route::get('/clientes', fn() => Inertia::render('clientes/clientes'))->name('clientes');
    Route::get('/delivery', fn() => Inertia::render('clientes/delivery'))->name('delivery');

    // CONFIGURACIÓN
    Route::get('/configuracion', fn() => Inertia::render('configuracion/configuracion'))->name('configuracion');
    Route::get('/perfil', fn() => Inertia::render('configuracion/perfil'))->name('perfil');
});
require __DIR__.'/settings.php';