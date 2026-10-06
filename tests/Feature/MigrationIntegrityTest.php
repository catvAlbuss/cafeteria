<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Un archivo de migración borrado sin quitar su fila de `migrations` deja al
 * esquema del repositorio desincronizado de la base real: `migrate` no lo
 * vuelve a crear nunca y una instalación limpia queda incompleta.
 */
function migracionesDisponibles(): array
{
    return collect(File::files(database_path('migrations')))
        ->map(fn ($file) => $file->getFilenameWithoutExtension())
        ->values()
        ->all();
}

test('no hay migraciones aplicadas sin archivo en disco', function () {
    $aplicadas = DB::table('migrations')->pluck('migration');

    expect($aplicadas->diff(migracionesDisponibles())->all())->toBe([]);
});

test('no queda ninguna migracion del repositorio sin aplicar', function () {
    $aplicadas = DB::table('migrations')->pluck('migration');

    expect(array_diff(migracionesDisponibles(), $aplicadas->all()))->toBe([]);
});
