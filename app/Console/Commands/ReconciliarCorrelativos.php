<?php

namespace App\Console\Commands;

use App\Models\Factura;
use App\Models\Pedido;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReconciliarCorrelativos extends Command
{
    protected $signature = 'sunat:reconciliar-correlativos
        {--fix : Corregir el contador cuando el maximo de facturas sea mayor}
        {--json : Salida en formato JSON}';

    protected $description = 'Compara el contador local de correlativos con los comprobantes registrados y detecta divergencias';

    public function handle(): int
    {
        $ruc = config('sunat.ruc');
        $problemas = [];

        $series = DB::table('correlativos_control')
            ->where('ruc', $ruc)
            ->orderBy('serie')
            ->get();

        $divergencias = [];
        $seriesConRegistros = [
            'B001' => Factura::where('serie', 'B001')->pluck('correlativo')->map(fn ($c) => (int) $c)->max() ?? 0,
            'F001' => Factura::where('serie', 'F001')->pluck('correlativo')->map(fn ($c) => (int) $c)->max() ?? 0,
            'RC01' => $this->maxResumenEnviado(),
        ];

        foreach ($series as $control) {
            $local = (int) $control->ultimo_correlativo;
            $registrado = (int) ($seriesConRegistros[$control->serie] ?? 0);

            if ($registrado > $local) {
                $divergencias[] = [
                    'serie' => $control->serie,
                    'contador' => $local,
                    'registrado' => $registrado,
                ];
                $problemas[] = "La serie {$control->serie} tiene contador en {$local} pero existen comprobantes hasta el {$registrado}. "
                    .'La proxima emision intentara reutilizar un numero y SUNAT la rechazara.';
            }
        }

        foreach ($seriesConRegistros as $serie => $registrado) {
            $existe = $series->firstWhere('serie', $serie);

            if (! $existe && $registrado > 0) {
                $divergencias[] = ['serie' => $serie, 'contador' => 0, 'registrado' => $registrado];
                $problemas[] = "La serie {$serie} no tiene fila de control pero hay comprobantes hasta el {$registrado}.";
            }
        }

        // Sin withoutGlobalScopes el Trait BelongsToTeam oculta los pedidos de
        // otras sedes y el diagnostico daria un falso "todo correcto".
        $huerfanos = Pedido::withoutGlobalScopes()
            ->whereNotNull('factura_numero')
            ->whereNotIn('factura_numero', function ($query) {
                $query->select('documento')->from('facturas');
            })
            ->get(['id', 'numero', 'factura_numero']);

        $sinArchivo = Factura::where('estado_sunat', 'aceptado')
            ->get(['idfactura', 'serie', 'correlativo', 'documento'])
            ->filter(fn ($f) => $f->documento && ! Storage::exists('invoices/'.str_replace('.pdf', '', $f->documento).'.xml'));

        if ($huerfanos->isNotEmpty()) {
            $problemas[] = $huerfanos->count().' pedido(s) apuntan a un comprobante que no existe en la tabla facturas: '
                .$huerfanos->pluck('factura_numero')->unique()->implode(', ');
        }

        if ($sinArchivo->isNotEmpty()) {
            $problemas[] = $sinArchivo->count().' comprobante(s) aceptados sin XML en disco: '
                .$sinArchivo->map(fn ($f) => "{$f->serie}-{$f->correlativo}")->implode(', ');
        }

        if ($this->option('json')) {
            $payload = json_encode([
                'ruc' => $ruc,
                'series' => $series->map(fn ($s) => [
                    'serie' => $s->serie,
                    'ultimo_correlativo' => (int) $s->ultimo_correlativo,
                    'estado' => $s->estado,
                    'documento' => $s->documento,
                ]),
                'divergencias' => $divergencias,
                'pedidos_huerfanos' => $huerfanos->count(),
                'comprobantes_sin_xml' => $sinArchivo->count(),
                'problemas' => $problemas,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            if ($payload === false) {
                $this->error('No se pudo serializar el resultado a JSON.');

                return self::FAILURE;
            }

            $this->line($payload);

            return $problemas === [] ? self::SUCCESS : self::FAILURE;
        }

        $this->info("RUC configurado: {$ruc}");
        $this->newLine();
        $this->table(
            ['Serie', 'Ultimo', 'Estado', 'Documento'],
            $series->map(fn ($s) => [
                $s->serie,
                $s->ultimo_correlativo,
                $s->estado ?? '-',
                $s->documento ?? '-',
            ])->all()
        );

        if ($problemas === []) {
            $this->info('Sin divergencias. Los contadores coinciden con los comprobantes registrados.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->warn(count($problemas).' problema(s) detectado(s):');
        foreach ($problemas as $problema) {
            $this->line('  - '.$problema);
        }

        if ($this->option('fix') && $divergencias !== []) {
            $this->newLine();
            foreach ($divergencias as $divergencia) {
                DB::table('correlativos_control')
                    ->where('ruc', $ruc)
                    ->where('serie', $divergencia['serie'])
                    ->update([
                        'ultimo_correlativo' => $divergencia['registrado'],
                        'updated_at' => now(),
                    ]);

                $this->info("Serie {$divergencia['serie']} corregida a {$divergencia['registrado']}.");
            }

            $this->warn('Revisa el estado en SUNAT antes de volver a emitir: el contador local nunca debe quedar por debajo de lo ya enviado.');
        }

        return self::FAILURE;
    }

    private function maxResumenEnviado(): int
    {
        $ultimo = DB::table('facturas')
            ->whereNotNull('resumen_id')
            ->orderByDesc('idfactura')
            ->value('resumen_id');

        if (! $ultimo) {
            return 0;
        }

        $partes = explode('-', $ultimo);

        return (int) str_replace('.zip', '', $partes[3] ?? '0');
    }
}
