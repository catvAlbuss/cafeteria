<?php

use App\Http\Controllers\CajaController;
use App\Http\Controllers\ContadorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\MesaController;
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

    Route::get('/caja', fn() => Inertia::render('dinero/caja'))->name('caja');
    Route::post('/caja/registrar', [CajaController::class, 'registrar'])->name('caja.registrar');
    Route::get('/caja/estado', [CajaController::class, 'estado'])->name('caja.estado');
    Route::get('/ventas', [PedidoController::class, 'index'])->name('ventas');
    Route::patch('/pedidos/{id}/marcar-listo', [PedidoController::class, 'marcarListo'])->name('pedidos.marcar-listo');

    // Contador
    Route::get('/contador', [ContadorController::class, 'index'])->name('contador.index');
    Route::post('/contador/abrir', [ContadorController::class, 'abrir'])->name('contador.abrir');

    Route::get('/caja', fn () => Inertia::render('dinero/caja'))->middleware('can:ver caja')->name('caja');
    Route::post('/caja/registrar', [CajaController::class, 'registrar'])->middleware('operating.hours')->name('caja.registrar');
    Route::get('/caja/estado', [CajaController::class, 'estado'])->name('caja.estado');
    Route::get('/ventas', [PedidoController::class, 'index'])->middleware('can:ver ventas')->name('ventas');
    Route::patch('/pedidos/{id}/marcar-listo', [PedidoController::class, 'marcarListo'])->name('pedidos.marcar-listo');

    //  Solo esta ruta para el contador (con el controlador)
    Route::get('/contador', [ContadorController::class, 'index'])->middleware('can:ver contador')->name('contador.index');
    Route::post('/contador/abrir', [ContadorController::class, 'abrir'])->middleware('operating.hours')->name('contador.abrir');

    Route::post('/contador/cerrar/{id}', [ContadorController::class, 'cerrar'])->name('contador.cerrar');
    Route::delete('/contador/{id}', [ContadorController::class, 'destroy'])->name('contador.destroy');

    // Reportes

    Route::get('/reportes', [ReporteController::class, 'index'])->name('reportes.index');

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
    Route::delete('/platos/{plato}', [PlatoController::class, 'destroy'])->name('platos.destroy');
    Route::patch('/platos/{id}/disponibilidad', [PlatoController::class, 'toggleDisponibilidad'])->name('platos.disponibilidad');

    // ----------------------------
    //  INVENTARIO
    // ----------------------------

    Route::get('/produccion', [PedidoController::class, 'produccion'])->name('produccion');
    Route::get('/cardex', fn() => Inertia::render('inventario/cardex'))->name('cardex');
    Route::get('/mermas', fn() => Inertia::render('inventario/mermas'))->name('mermas');

    // ----------------------------
    //  CLIENTES
    // ----------------------------
    Route::get('/clientes', fn() => Inertia::render('clientes/clientes'))->name('clientes');

    Route::get('/delivery', [DeliveryController::class, 'index'])->name('delivery');
    Route::post('/delivery', [DeliveryController::class, 'store'])->name('delivery.store');

    Route::get('/produccion', [PedidoController::class, 'produccion'])->middleware('can:ver produccion')->name('produccion');
    Route::get('/cardex', fn () => Inertia::render('inventario/cardex'))->middleware('can:ver cardex')->name('cardex');
    Route::get('/mermas', fn () => Inertia::render('inventario/mermas'))->middleware('can:ver mermas')->name('mermas');

    // ----------------------------
    // 🧾 CLIENTES
    // ----------------------------
    Route::get('/clientes', fn () => Inertia::render('clientes/clientes'))->middleware('can:ver clientes')->name('clientes');

    Route::get('/delivery', [DeliveryController::class, 'index'])->middleware('can:ver delivery')->name('delivery');
    Route::post('/delivery', [DeliveryController::class, 'store'])->middleware('operating.hours')->name('delivery.store');

    Route::patch('/delivery/{delivery}/enviar', [DeliveryController::class, 'enviar'])->name('delivery.enviar');
    Route::patch('/delivery/{delivery}/entregar', [DeliveryController::class, 'entregar'])->name('delivery.entregar');
    Route::patch('/delivery/{delivery}/cancelar', [DeliveryController::class, 'cancelar'])->name('delivery.cancelar');
    Route::delete('/delivery/{delivery}', [DeliveryController::class, 'destroy'])->name('delivery.destroy');
    Route::patch('/delivery/{delivery}/cocina', [DeliveryController::class, 'cocina'])->name('delivery.cocina');
    Route::patch('/delivery/{delivery}/listo', [DeliveryController::class, 'listoParaEntregar'])->name('delivery.listo');
    Route::patch('/delivery/{delivery}/en-ruta', [DeliveryController::class, 'enRuta'])->name('delivery.en-ruta');

    // ----------------------------
    //  CONFIGURACIÓN
    // ----------------------------

    Route::get('/configuracion', fn() => Inertia::render('configuracion/configuracion'))->name('configuracion');
    Route::get('/perfil', fn() => Inertia::render('configuracion/perfil'))->name('perfil');

    // ----------------------------
    // API/RECURSOS (Controladores)
    // ----------------------------

    // PLATOS
    Route::resource('platos', PlatoController::class);

    Route::get('/configuracion', fn () => Inertia::render('configuracion/configuracion'))->middleware('can:configuracion sistema')->name('configuracion');
    Route::get('/perfil', fn () => Inertia::render('configuracion/perfil'))->name('perfil');

    // ----------------------------
    //  API/RECURSOS (Controladores)
    // ----------------------------

    // PLATOS
    Route::resource('platos', PlatoController::class)->middlewareFor('index', 'can:ver platos');


    // MESAS
    Route::resource('mesas', MesaController::class)->middlewareFor('index', 'can:ver mesas');
    Route::patch('/mesas/{mesa}/estado', [MesaController::class, 'update'])->name('mesas.estado');
    Route::get('/api/mesas/{numero}', [MesaController::class, 'getByNumero'])->name('api.mesas.byNumero');
    Route::post('/mesas/{mesa}/pedido-listo', [MesaController::class, 'marcarPedidoListo'])->name('mesas.pedido-listo');
    Route::post('/mesas/{mesa}/entregar', [MesaController::class, 'entregar'])->name('mesas.entregar');
    Route::patch('/mesas/{origen}/transferir-silla/{destino}', [MesaController::class, 'transferirSilla'])
        ->name('mesas.transferir-silla');

    // PEDIDOS

    Route::resource('pedidos', PedidoController::class); // ya incluye PATCH /pedidos/{pedido} -> update
    Route::get('/pedidos/pendientes', [PedidoController::class, 'pendientes'])->name('pedidos.pendientes');
    Route::get('/pedidos/listos', [PedidoController::class, 'listosParaCobrar'])->name('pedidos.listos');
    Route::patch('/pedidos/{pedido}/cobrar', [PedidoController::class, 'cobrar'])->name('pedidos.cobrar');
    Route::patch('/pedidos/{pedido}/cancelar', [PedidoController::class, 'cancelar'])->name('pedidos.cancelar');

    Route::resource('pedidos', PedidoController::class)->except(['store']);
    Route::post('/pedidos', [PedidoController::class, 'store'])->middleware('operating.hours')->name('pedidos.store');
    Route::get('/pedidos/pendientes', [PedidoController::class, 'pendientes'])->name('pedidos.pendientes');
    Route::get('/pedidos/listos', [PedidoController::class, 'listosParaCobrar'])->name('pedidos.listos');
    Route::patch('/pedidos/{pedido}/cobrar', [PedidoController::class, 'cobrar'])->name('pedidos.cobrar');
    Route::patch('/pedidos/{pedido}', [PedidoController::class, 'update'])->name('pedidos.update');


    // ----------------------------
    //  INVITACIONES (Opcional)
    // ----------------------------
    Route::get('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');

});




    //  NUEVAS RUTAS PARA MESAS
    // (si es necesario añadir rutas adicionales para mesas, hacerlo dentro del grupo de autenticación arriba)


Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        // Route::get('dashboard', DashboardController::class)->name('dashboard');
    });



require __DIR__.'/settings.php';


