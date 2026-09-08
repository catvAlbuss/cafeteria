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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('usuario')->nullable()->unique();
            $table->string('dni', 8)->nullable()->unique();
            $table->string('telefono', 15)->nullable();
            $table->string('direccion', 255)->nullable();
            $table->integer('nro_hijos')->nullable();
            $table->enum('afiliado', ['ONP', 'AFP'])->nullable();
            $table->enum('asegurado', ['ESSALUD', 'SIS'])->nullable();
            $table->enum('modalidad_trabajo', ['part_time', 'full_time', 'online'])->nullable();
            $table->decimal('retencion', 10, 2)->nullable();
            $table->string('ingreso_panilla')->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->date('fecha_ingreso')->nullable();
            $table->date('fecha_cese')->nullable();
            $table->enum('modalidad_pago', ['semanal', 'quincenal', 'mensual'])->nullable();
            $table->decimal('salario', 10, 2)->nullable();
            $table->string('foto')->nullable();
            $table->boolean('estado')->default(0);
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
