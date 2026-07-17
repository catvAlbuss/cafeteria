<?php

test('the public reverb connection data is rendered at runtime', function () {
    config()->set('broadcasting.connections.reverb.key', 'public-test-key');
    config()->set('broadcasting.connections.reverb.options.host', 'ws.example.com');
    config()->set('broadcasting.connections.reverb.options.port', 443);
    config()->set('broadcasting.connections.reverb.options.scheme', 'https');

    $this->get('/')
        ->assertOk()
        ->assertSee('name="reverb-key" content="public-test-key"', false)
        ->assertSee('name="reverb-host" content="ws.example.com"', false)
        ->assertSee('name="reverb-port" content="443"', false)
        ->assertSee('name="reverb-scheme" content="https"', false);
});
