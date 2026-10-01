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
        Schema::table('facturas', function (Blueprint $table) {
            if (! Schema::hasColumn('facturas', 'resumen_ticket')) {
                $table->string('resumen_ticket', 255)->nullable()->after('codigo_sunat');
            }

            if (! Schema::hasColumn('facturas', 'resumen_id')) {
                $table->string('resumen_id', 255)->nullable()->after('resumen_ticket');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('facturas', function (Blueprint $table) {
            foreach (['resumen_id', 'resumen_ticket'] as $column) {
                if (Schema::hasColumn('facturas', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
