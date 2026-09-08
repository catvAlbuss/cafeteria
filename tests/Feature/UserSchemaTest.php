<?php

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Schema;

test('the users table contains one unique usuario column', function () {
    expect(Schema::hasColumn('users', 'usuario'))->toBeTrue();

    User::factory()->create(['usuario' => 'mesero']);

    expect(fn () => User::factory()->create(['usuario' => 'mesero']))
        ->toThrow(UniqueConstraintViolationException::class);
});
