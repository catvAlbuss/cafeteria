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

//paginas 

Route::get('/ventas', function () {
    return Inertia::render('dinero/ventas');
})->name('ventas');

//pagina de caja//
Route::get('/caja', function () {
    return Inertia::render('dinero/caja');
})->name('caja');

Route::get('/mesas', function () {
    return Inertia::render('restaurante/mesas');
})->name('mesas');

Route::get('/produccion', function () {
    return Inertia::render('inventario/produccion');
})->name('produccion');

require __DIR__.'/settings.php';