<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('insumos', function (Blueprint $table) {
            $table->decimal('stock_minimo', 10, 2)->default(5)->after('stock');
            $table->date('fecha_vencimiento')->nullable()->after('stock_minimo');
            $table->index(['team_id', 'fecha_vencimiento']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('insumos', function (Blueprint $table) {
            $table->dropIndex(['team_id', 'fecha_vencimiento']);
            $table->dropColumn(['stock_minimo', 'fecha_vencimiento']);
        });
    }
};
