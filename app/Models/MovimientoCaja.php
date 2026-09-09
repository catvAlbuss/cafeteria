<?php

namespace App\Models;

use App\Traits\BelongsToTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoCaja extends Model
{
    use BelongsToTeam;

    protected $table = 'movimientos_caja';

    protected $fillable = ['team_id', 'caja_id', 'user_id', 'tipo', 'concepto', 'monto'];

    protected $casts = ['monto' => 'decimal:2'];

    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
