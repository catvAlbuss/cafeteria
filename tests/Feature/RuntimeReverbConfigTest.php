<?php

test('the public reverb connection data is rendered at runtime', function () {
    config()->set('broadcasting.default', 'reverb');
    config()->set('broadcasting.connections.reverb.key', 'public-test-key');
    config()->set('broadcasting.connections.reverb.options.host', 'ws.example.com');
    config()->set('broadcasting.connections.reverb.options.port', 443);
    config()->set('broadcasting.connections.reverb.options.scheme', 'https');

    $this->get('/')
        ->assertOk()
        ->assertSee('name="broadcast-driver" content="reverb"', false)
        ->assertSee('name="reverb-key" content="public-test-key"', false)
        ->assertSee('name="reverb-host" content="ws.example.com"', false)
        ->assertSee('name="reverb-port" content="443"', false)
        ->assertSee('name="reverb-scheme" content="https"', false);
});

test('the public pusher connection data is rendered at runtime', function () {
    config()->set('broadcasting.default', 'pusher');
    config()->set('broadcasting.connections.pusher.key', 'public-pusher-key');
    config()->set('broadcasting.connections.pusher.options.cluster', 'us2');

    $this->get('/')
        ->assertOk()
        ->assertSee('name="broadcast-driver" content="pusher"', false)
        ->assertSee('name="pusher-key" content="public-pusher-key"', false)
        ->assertSee('name="pusher-cluster" content="us2"', false);
});
