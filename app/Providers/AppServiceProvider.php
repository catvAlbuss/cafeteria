<?php

namespace App\Providers;

use App\Events\MesaActualizada;
use App\Events\PedidoActualizado;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureCacheInvalidation();
    }

    /**
     * Invalidate caches when the underlying data changes, mirroring the
     * events that already drive real-time broadcasting.
     */
    protected function configureCacheInvalidation(): void
    {
        Event::listen(MesaActualizada::class, function (MesaActualizada $event) {
            Cache::forget('mesas.mapa.'.$event->mesa->team_id);
        });

        Event::listen(PedidoActualizado::class, function (PedidoActualizado $event) {
            if ($event->pedido->estado !== 'pagado') {
                return;
            }

            $fechaInicio = now()->startOfMonth()->toDateString();
            $fechaFin = now()->toDateString();

            Cache::forget("reportes.dashboard.{$event->pedido->team_id}.{$fechaInicio}.{$fechaFin}");
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
