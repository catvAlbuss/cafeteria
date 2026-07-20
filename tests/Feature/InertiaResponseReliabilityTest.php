<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

beforeEach(function () {
    Route::middleware('web')->get('/inertia-reliability-test', fn () => Inertia::render('welcome'));
});

test('a direct page visit returns private non-cacheable html', function () {
    $response = $this->get('/inertia-reliability-test');

    $response->assertOk()
        ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
        ->assertHeader('Cache-Control', 'must-revalidate, no-cache, no-store, private')
        ->assertHeader('Vary', 'X-Inertia, Accept-Encoding');
});

test('a document navigation cannot receive raw inertia json', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
        'Sec-Fetch-Mode' => 'navigate',
        'Sec-Fetch-Dest' => 'document',
    ])->get('/inertia-reliability-test');

    $response->assertOk()
        ->assertHeader('Content-Type', 'text/html; charset=UTF-8')
        ->assertSee('<!DOCTYPE html>', false);
});

test('a genuine inertia request still receives json', function () {
    $version = app(HandleInertiaRequests::class)->version(request());

    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $version,
        'X-Requested-With' => 'XMLHttpRequest',
        'Sec-Fetch-Mode' => 'cors',
        'Sec-Fetch-Dest' => 'empty',
    ])->get('/inertia-reliability-test');

    $response->assertOk()
        ->assertHeader('X-Inertia', 'true')
        ->assertHeader('Content-Type', 'application/json')
        ->assertJsonPath('component', 'welcome');
});

test('an asset version mismatch is not cached', function () {
    $response = $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
        'X-Inertia-Version' => 'stale-version',
        'Sec-Fetch-Mode' => 'cors',
        'Sec-Fetch-Dest' => 'empty',
    ])->get('/inertia-reliability-test');

    $response->assertConflict()
        ->assertHeader('X-Inertia-Location', url('/inertia-reliability-test'))
        ->assertHeader('Cache-Control', 'must-revalidate, no-cache, no-store, private')
        ->assertHeader('Vary', 'X-Inertia, Accept-Encoding');
});
