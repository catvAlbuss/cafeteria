<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use App\Http\Controllers\PlatoController;
use App\Http\Controllers\MesaController;
use App\Http\Controllers\PedidoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============================================================
//  RUTAS PÚBLICAS (Sin autenticación)
// ============================================================

// Ruta principal → Login
Route::inertia('/', 'auth/login')->name('home');

//  RUTAS CON AUTENTICACIÓN
Route::middleware(['auth'])->group(function () {

    // ----------------------------
    //  DASHBOARD
    // ----------------------------
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');


    // ----------------------------
    //  DINERO
    // ----------------------------
    Route::get('/caja', fn() => Inertia::render('dinero/caja'))->name('caja');
    Route::get('/ventas', fn() => Inertia::render('dinero/ventas'))->name('ventas');
    Route::get('/reportes', fn() => Inertia::render('dinero/reportes'))->name('reportes');
    Route::get('/contador', fn() => Inertia::render('dinero/contador'))->name('contador');


    // ----------------------------
    //  RESTAURANTE
    // ----------------------------
    Route::get('/platos', fn() => Inertia::render('restaurante/platos'))->name('platos');
    Route::get('/mesas', fn() => Inertia::render('restaurante/mesas'))->name('mesas');
    Route::get('/mesas/distribucion', fn() => Inertia::render('restaurante/mesas-distribucion'))->name('mesas.distribucion');
    Route::get('/covers', fn() => Inertia::render('restaurante/covers'))->name('covers');


    // ----------------------------
    //  INVENTARIO
    // ----------------------------
    Route::get('/produccion', [PedidoController::class, 'produccion'])->name('produccion');
    Route::get('/cardex', fn() => Inertia::render('inventario/cardex'))->name('cardex');
    Route::get('/mermas', fn() => Inertia::render('inventario/mermas'))->name('mermas');
    Route::get('/etiquetas', fn() => Inertia::render('inventario/etiquetas'))->name('etiquetas');

    // ----------------------------
    //  CLIENTES
    // ----------------------------
    Route::get('/clientes', fn() => Inertia::render('clientes/clientes'))->name('clientes');
    Route::get('/delivery', fn() => Inertia::render('clientes/delivery'))->name('delivery');

    // ----------------------------
    //  CONFIGURACIÓN
    // ----------------------------
    Route::get('/configuracion', fn() => Inertia::render('configuracion/configuracion'))->name('configuracion');
    Route::get('/perfil', fn() => Inertia::render('configuracion/perfil'))->name('perfil');


    // ----------------------------
    //  API/RECURSOS (Controladores)
    // ----------------------------
    
    // PLATOS
    Route::resource('platos', PlatoController::class);
    
    // MESAS
    Route::resource('mesas', MesaController::class);
    Route::patch('/mesas/{mesa}/estado', [MesaController::class, 'update'])->name('mesas.estado');
    Route::get('/api/mesas/{numero}', [MesaController::class, 'getByNumero'])->name('api.mesas.byNumero');
    Route::post('/mesas/{mesa}/pedido-listo', [MesaController::class, 'marcarPedidoListo'])->name('mesas.pedido-listo');
    Route::post('/mesas/{mesa}/entregar', [MesaController::class, 'entregar'])->name('mesas.entregar');
    Route::patch('/mesas/{origen}/transferir-silla/{destino}', [MesaController::class, 'transferirSilla'])
    ->name('mesas.transferir-silla');
    
    // PEDIDOS
    Route::resource('pedidos', PedidoController::class);
    Route::get('/pedidos/pendientes', [PedidoController::class, 'pendientes'])->name('pedidos.pendientes');
    Route::get('/pedidos/listos', [PedidoController::class, 'listosParaCobrar'])->name('pedidos.listos');
    Route::patch('/pedidos/{pedido}/cobrar', [PedidoController::class, 'cobrar'])->name('pedidos.cobrar');


    // ----------------------------
    //  INVITACIONES (Opcional)
    // ----------------------------
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');

     //  NUEVAS RUTAS PARA MESAS
    Route::post('/mesas/{mesa}/pedido-listo', [MesaController::class, 'marcarPedidoListo'])->name('mesas.pedido-listo');
    Route::post('/mesas/{mesa}/entregar', [MesaController::class, 'entregar'])->name('mesas.entregar');
});




Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        // Route::get('dashboard', DashboardController::class)->name('dashboard');
    });


require __DIR__.'/settings.php';