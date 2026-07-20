<?php

use App\Http\Middleware\EnsureOpenCashSession;
use App\Http\Middleware\EnsureOperatingHours;
use App\Http\Middleware\EnsureReliableInertiaResponses;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetPermissionsTeam;
use App\Http\Middleware\SetTeamUrlDefaults;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            SetPermissionsTeam::class,
            EnsureReliableInertiaResponses::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            SetTeamUrlDefaults::class,
        ]);

        $middleware->alias([
            'operating.hours' => EnsureOperatingHours::class,
            'cash.session' => EnsureOpenCashSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();

            // Los 500 en local/testing deben seguir mostrando la página de debug de Laravel.
            $friendlyStatuses = app()->hasDebugModeEnabled()
                ? [403, 404, 419, 429]
                : [403, 404, 419, 429, 500, 503];

            if ($request->is('api/*') || $request->expectsJson() || ! in_array($status, $friendlyStatuses)) {
                return $response;
            }

            return Inertia::render('errors/error-page', ['status' => $status])
                ->toResponse($request)
                ->setStatusCode($status);
        });
    })->create();
