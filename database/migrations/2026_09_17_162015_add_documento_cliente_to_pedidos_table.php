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
            $table->string('tipo_documento', 5)->nullable()->after('cliente');
            $table->string('documento_cliente', 15)->nullable()->after('tipo_documento');
            $table->string('nombre_cliente', 255)->nullable()->after('documento_cliente');
            $table->index(['documento_cliente', 'tipo_documento']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropIndex(['documento_cliente', 'tipo_documento']);
            $table->dropColumn(['tipo_documento', 'documento_cliente', 'nombre_cliente']);
        });
    }
};
