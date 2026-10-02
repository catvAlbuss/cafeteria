<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuraciones_facturacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->string('ruc', 11);
            $table->string('razon_social');
            $table->string('nombre_comercial')->nullable();
            $table->string('direccion');
            $table->string('ubigeo', 6)->default('100101');
            $table->string('departamento')->default('HUANUCO');
            $table->string('provincia')->default('HUANUCO');
            $table->string('distrito')->default('HUANUCO');
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('serie_factura', 4)->default('F001');
            $table->string('serie_boleta', 4)->default('B001');
            $table->string('certificado_path')->nullable();
            $table->string('sol_usuario')->nullable();
            $table->text('sol_clave')->nullable();
            $table->string('sunat_url')->default('https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService');
            $table->string('ambiente', 20)->default('produccion');
            $table->timestamps();

            $table->unique(['team_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuraciones_facturacion');
    }
};