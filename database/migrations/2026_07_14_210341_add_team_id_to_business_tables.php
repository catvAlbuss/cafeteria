<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add team_id to platos
        Schema::table('platos', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
            $table->index('team_id');
        });

        // Add team_id and user_id to mesas, convert mesero string to user_id FK
        Schema::table('mesas', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->after('mesero')->constrained('users')->nullOnDelete();
            $table->dropColumn('mesero');
            $table->index('team_id');
        });

        // Add team_id and user_id to pedidos
        Schema::table('pedidos', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->after('mesa_id')->constrained('users')->nullOnDelete();
            $table->index('team_id');
        });

        // Add team_id and user_id to cajas, convert empleado string to user_id FK
        Schema::table('cajas', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->after('empleado')->constrained('users')->nullOnDelete();
            $table->dropColumn('empleado');
            $table->index('team_id');
        });

        // Add team_id and user_id to deliveries
        Schema::table('deliveries', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->after('repartidor')->constrained('users')->nullOnDelete();
            $table->index('team_id');
        });

        // Add pin, is_active, and operating hours to users
        Schema::table('users', function (Blueprint $table) {
            $table->string('pin', 4)->nullable()->unique()->after('password');
            $table->boolean('is_active')->default(true)->after('estado');
            $table->softDeletes();
        });

        // Add operating hours to teams (sedes)
        Schema::table('teams', function (Blueprint $table) {
            $table->time('hora_apertura')->default('07:00')->after('is_personal');
            $table->time('hora_cierre')->default('23:00')->after('hora_apertura');
            $table->string('zona_horaria', 50)->default('America/Lima')->after('hora_cierre');
        });
    }

    public function down(): void
    {
        Schema::table('platos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_id');
        });

        Schema::table('mesas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropConstrainedForeignId('team_id');
            $table->string('mesero')->nullable();
        });

        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropConstrainedForeignId('team_id');
        });

        Schema::table('cajas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropConstrainedForeignId('team_id');
            $table->string('empleado', 100);
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropConstrainedForeignId('team_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['pin', 'is_active', 'deleted_at']);
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn(['hora_apertura', 'hora_cierre', 'zona_horaria']);
        });
    }
};
