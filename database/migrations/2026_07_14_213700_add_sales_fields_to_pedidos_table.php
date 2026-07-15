<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            if (! Schema::hasColumn('pedidos', 'mesa')) {
                $table->string('mesa')->nullable()->after('mesa_id');
            }

            if (! Schema::hasColumn('pedidos', 'tipo')) {
                $table->string('tipo', 30)->default('mesa')->after('cliente');
                $table->index('tipo');
            }

            if (! Schema::hasColumn('pedidos', 'metodo_pago')) {
                $table->string('metodo_pago', 30)->nullable()->after('tipo');
            }

            if (! Schema::hasColumn('pedidos', 'subtotal')) {
                $table->decimal('subtotal', 10, 2)->default(0)->after('productos');
            }

            if (! Schema::hasColumn('pedidos', 'igv')) {
                $table->decimal('igv', 10, 2)->default(0)->after('subtotal');
            }

            if (! Schema::hasColumn('pedidos', 'caja_id')) {
                $table->foreignId('caja_id')->nullable()->after('total')->constrained('cajas')->nullOnDelete();
            }
        });

        DB::table('pedidos')
            ->whereNull('tipo')
            ->orWhere('tipo', '')
            ->update([
                'tipo' => DB::raw("CASE WHEN mesa_id IS NULL THEN 'caja' ELSE 'mesa' END"),
            ]);

        DB::table('pedidos')
            ->where('subtotal', 0)
            ->update([
                'subtotal' => DB::raw('total'),
            ]);
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            if (Schema::hasColumn('pedidos', 'caja_id')) {
                $table->dropConstrainedForeignId('caja_id');
            }

            foreach (['igv', 'subtotal', 'metodo_pago', 'tipo', 'mesa'] as $column) {
                if (Schema::hasColumn('pedidos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
