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
        Schema::table('pedidos', function (Blueprint $table) {
            if (! Schema::hasColumn('pedidos', 'factura_estado')) {
                $table->string('factura_estado', 50)->nullable()->after('metodo_pago');
            }

            if (! Schema::hasColumn('pedidos', 'factura_numero')) {
                $table->string('factura_numero', 50)->nullable()->after('factura_estado');
            }

            if (! Schema::hasColumn('pedidos', 'factura_pdf_url')) {
                $table->string('factura_pdf_url', 255)->nullable()->after('factura_numero');
            }

            if (! Schema::hasColumn('pedidos', 'factura_xml_url')) {
                $table->string('factura_xml_url', 255)->nullable()->after('factura_pdf_url');
            }

            if (! Schema::hasColumn('pedidos', 'factura_cdr_url')) {
                $table->string('factura_cdr_url', 255)->nullable()->after('factura_xml_url');
            }

            if (! Schema::hasColumn('pedidos', 'factura_respuesta')) {
                $table->text('factura_respuesta')->nullable()->after('factura_cdr_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            foreach (['factura_estado', 'factura_numero', 'factura_pdf_url', 'factura_xml_url', 'factura_cdr_url', 'factura_respuesta'] as $column) {
                if (Schema::hasColumn('pedidos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
