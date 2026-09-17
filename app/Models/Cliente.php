<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Database\Factories\ClienteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $team_id
 * @property string|null $tipo_documento
 * @property string|null $documento
 * @property string $nombre
 * @property string|null $telefono
 * @property string|null $email
 * @property string|null $direccion
 * @property string $estado
 * @property Carbon|null $ultima_visita
 * @property int $pedidos_total
 * @property int $pedidos_30d
 * @property string $total_gastado_30d
 * @property string $total_gastado
 */
class Cliente extends Model
{
    /** @use HasFactory<ClienteFactory> */
    use BelongsToTeam, HasFactory;

    public const ESTADO_INACTIVO = 'inactivo';

    public const ESTADO_ACTIVO = 'activo';

    public const ESTADO_VIP = 'vip';

    public const MIN_COMPRAS_ACTIVO = 1;

    public const MIN_COMPRAS_VIP = 16;

    protected $fillable = [
        'team_id',
        'tipo_documento',
        'documento',
        'nombre',
        'telefono',
        'email',
        'direccion',
        'estado',
        'ultima_visita',
        'pedidos_total',
        'pedidos_30d',
        'total_gastado_30d',
        'total_gastado',
    ];

    protected $casts = [
        'ultima_visita' => 'datetime',
        'pedidos_total' => 'integer',
        'pedidos_30d' => 'integer',
        'total_gastado_30d' => 'decimal:2',
        'total_gastado' => 'decimal:2',
    ];

    /**
     * Determine the state based on the amount of purchases in the last 30 days.
     */
    public static function calcularEstado(int $pedidos30d): string
    {
        if ($pedidos30d <= 0) {
            return self::ESTADO_INACTIVO;
        }

        if ($pedidos30d >= self::MIN_COMPRAS_VIP) {
            return self::ESTADO_VIP;
        }

        return self::ESTADO_ACTIVO;
    }
}
