<?php

use App\Http\Controllers\CajaController;
use App\Http\Controllers\CardexController;
use App\Http\Controllers\ContadorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\InsumoController;
use App\Http\Controllers\MermaController;
use App\Http\Controllers\MesaController;
use App\Http\Controllers\MovimientoCajaController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\PinController;
use App\Http\Controllers\PlatoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use App\Models\Cover;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============================================================
//  RUTAS PÚBLICAS (Sin autenticación)
// ============================================================

Route::inertia('/', 'auth/login')->name('home');

// 🔐 RUTAS CON AUTENTICACIÓN
Route::middleware(['auth'])->group(function () {

    // ----------------------------
    //  DASHBOARD
    // ----------------------------
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // ----------------------------
    //  PIN (autenticación rápida de empleados en terminal compartida)
    // ----------------------------
    Route::post('/pin/verificar', [PinController::class, 'verificar'])->name('pin.verificar');

    // ----------------------------
    //  DINERO
    // ----------------------------

    Route::get('/caja', fn () => Inertia::render('dinero/caja'))->middleware('can:ver caja')->name('caja');
    Route::post('/caja/registrar', [CajaController::class, 'registrar'])->middleware(['operating.hours', 'cash.session'])->name('caja.registrar');
    Route::get('/caja/estado', [CajaController::class, 'estado'])->name('caja.estado');
    Route::get('/ventas', [PedidoController::class, 'index'])->middleware('can:ver ventas')->name('ventas');
    Route::patch('/pedidos/{id}/marcar-listo', [PedidoController::class, 'marcarListo'])->middleware('cash.session')->name('pedidos.marcar-listo');

    //  Solo esta ruta para el contador (con el controlador)
    Route::get('/contador', [ContadorController::class, 'index'])->middleware('can:manage-cash-session')->name('contador.index');
    Route::post('/contador/abrir', [ContadorController::class, 'abrir'])->middleware(['can:manage-cash-session', 'operating.hours'])->name('contador.abrir');

    Route::post('/contador/cerrar/{id}', [ContadorController::class, 'cerrar'])->middleware('can:manage-cash-session')->name('contador.cerrar');
    Route::post('/contador/movimientos', [MovimientoCajaController::class, 'store'])->middleware('cash.session')->name('contador.movimientos.store');
    Route::delete('/contador/{id}', [ContadorController::class, 'destroy'])->name('contador.destroy');

    // Reportes

    Route::get('/reportes', [ReporteController::class, 'index'])->middleware('can:ver reportes')->name('reportes.index');

    // ----------------------------
    //  RESTAURANTE
    // ----------------------------
    Route::get('/mesas/distribucion', fn () => Inertia::render('restaurante/mesas-distribucion'))->middleware('can:ver mesas')->name('mesas.distribucion');
    Route::get('/covers', fn () => Inertia::render('restaurante/covers', [
        'covers' => Cover::query()
            ->orderByDesc('fecha_inicio')
            ->get()
            ->map(fn (Cover $cover) => [
                'id' => $cover->id,
                'titulo' => $cover->titulo,
                'descripcion' => $cover->descripcion,
                'tipo' => $cover->tipo,
                'estado' => $cover->estado,
                'imagen' => $cover->imagen,
                'fechaInicio' => $cover->fecha_inicio?->format('d/m/Y'),
                'fechaFin' => $cover->fecha_fin?->format('d/m/Y'),
                'clicks' => $cover->clicks,
                'categoria' => $cover->categoria,
            ])
            ->values()
            ->all(),
    ]))->middleware('can:ver covers')->name('covers');
    Route::patch('/platos/{id}/disponibilidad', [PlatoController::class, 'toggleDisponibilidad'])->middleware('cash.session')->name('platos.disponibilidad');

    // ----------------------------
    //  INVENTARIO
    // ----------------------------
    Route::get('/cardex', [CardexController::class, 'index'])->name('cardex.index');
    Route::get('/mermas', [MermaController::class, 'index'])->name('mermas.index');
    Route::post('/mermas', [MermaController::class, 'store'])->middleware('cash.session')->name('mermas.store');
    Route::resource('insumos', InsumoController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middlewareFor(['store', 'update', 'destroy'], 'cash.session');
    Route::get('/mi-inventario', [InsumoController::class, 'operativo'])
        ->middleware('can:ver produccion')
        ->name('insumos.operativo');
    Route::post('/insumos/{insumo}/comprar', [InsumoController::class, 'comprar'])->middleware('cash.session')->name('insumos.comprar');
    Route::post('/insumos/{insumo}/mermar', [InsumoController::class, 'mermar'])->middleware('cash.session')->name('insumos.mermar');
    Route::get('/produccion', [PedidoController::class, 'produccion'])->middleware('can:ver produccion')->name('produccion');

    // ----------------------------
    // 🧾 CLIENTES
    // ----------------------------
    Route::get('/clientes', fn () => Inertia::render('clientes/clientes'))->middleware('can:ver clientes')->name('clientes');

    Route::get('/delivery', [DeliveryController::class, 'index'])->middleware('can:ver delivery')->name('delivery');
    Route::post('/delivery', [DeliveryController::class, 'store'])->middleware(['operating.hours', 'cash.session'])->name('delivery.store');

    Route::patch('/delivery/{delivery}/enviar', [DeliveryController::class, 'enviar'])->middleware('cash.session')->name('delivery.enviar');
    Route::patch('/delivery/{delivery}/entregar', [DeliveryController::class, 'entregar'])->middleware('cash.session')->name('delivery.entregar');
    Route::patch('/delivery/{delivery}/cancelar', [DeliveryController::class, 'cancelar'])->middleware('cash.session')->name('delivery.cancelar');
    Route::delete('/delivery/{delivery}', [DeliveryController::class, 'destroy'])->middleware('cash.session')->name('delivery.destroy');
    Route::patch('/delivery/{delivery}/cocina', [DeliveryController::class, 'cocina'])->middleware('cash.session')->name('delivery.cocina');
    Route::patch('/delivery/{delivery}/listo', [DeliveryController::class, 'listoParaEntregar'])->middleware('cash.session')->name('delivery.listo');
    Route::patch('/delivery/{delivery}/en-ruta', [DeliveryController::class, 'enRuta'])->middleware('cash.session')->name('delivery.en-ruta');

    // ----------------------------
    //  CONFIGURACIÓN
    // ----------------------------

    // ----------------------------
    // API/RECURSOS (Controladores)
    // ----------------------------

    // PLATOS
    Route::get('/configuracion', fn () => Inertia::render('configuracion/configuracion'))->middleware('can:configuracion sistema')->name('configuracion');
    Route::get('/perfil', fn () => Inertia::render('configuracion/perfil'))->name('perfil');

    // ----------------------------
    //  API/RECURSOS (Controladores)
    // ----------------------------

    // PLATOS
    Route::resource('platos', PlatoController::class)
        ->middlewareFor('index', 'can:ver platos')
        ->middlewareFor(['store', 'update', 'destroy'], 'cash.session');

    // MESAS
    Route::resource('mesas', MesaController::class)
        ->middlewareFor('index', 'can:ver mesas')
        ->middlewareFor(['store', 'update', 'destroy'], 'cash.session');
    Route::patch('/mesas/{mesa}/estado', [MesaController::class, 'update'])->middleware('cash.session')->name('mesas.estado');
    Route::get('/api/mesas/{numero}', [MesaController::class, 'getByNumero'])->name('api.mesas.byNumero');
    Route::post('/mesas/{mesa}/pedido-listo', [MesaController::class, 'marcarPedidoListo'])->middleware('cash.session')->name('mesas.pedido-listo');
    Route::post('/mesas/{mesa}/entregar', [MesaController::class, 'entregar'])->middleware('cash.session')->name('mesas.entregar');
    Route::patch('/mesas/{origen}/transferir-silla/{destino}', [MesaController::class, 'transferirSilla'])
        ->middleware('cash.session')->name('mesas.transferir-silla');
    Route::patch('/mesas/{mesa}/cobrar', [PedidoController::class, 'cobrarMesa'])->middleware('cash.session')->name('mesas.cobrar');

    // PEDIDOS

    Route::get('/pedidos/pendientes', [PedidoController::class, 'pendientes'])->name('pedidos.pendientes');
    Route::get('/pedidos/listos', [PedidoController::class, 'listosParaCobrar'])->name('pedidos.listos');
    Route::patch('/pedidos/{pedido}/cobrar', [PedidoController::class, 'cobrar'])->middleware('cash.session')->name('pedidos.cobrar');
    Route::patch('/pedidos/{pedido}/cancelar', [PedidoController::class, 'cancelar'])->middleware('cash.session')->name('pedidos.cancelar');
    Route::resource('pedidos', PedidoController::class)
        ->except(['store'])
        ->middlewareFor(['update', 'destroy'], 'cash.session');
    Route::post('/pedidos', [PedidoController::class, 'store'])->middleware(['operating.hours', 'cash.session'])->name('pedidos.store');

    // ----------------------------
    //  INVITACIONES (Opcional)
    // ----------------------------
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');

});

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        // Route::get('dashboard', DashboardController::class)->name('dashboard');
    });

require __DIR__.'/settings.php';
