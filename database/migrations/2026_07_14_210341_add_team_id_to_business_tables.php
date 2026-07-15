<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add team_id to platos (solo si no existe)
        if (!Schema::hasColumn('platos', 'team_id')) {
            Schema::table('platos', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
                $table->index('team_id');
            });
        }

        // Add team_id and user_id to mesas (solo si no existen)
        if (!Schema::hasColumn('mesas', 'team_id')) {
            Schema::table('mesas', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
            });
        }

        if (!Schema::hasColumn('mesas', 'user_id')) {
            Schema::table('mesas', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('mesero')->constrained('users')->nullOnDelete();
                $table->index('team_id');
            });
        }

        // Add team_id and user_id to pedidos
        if (!Schema::hasColumn('pedidos', 'team_id')) {
            Schema::table('pedidos', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
                $table->index('team_id');
            });
        }

        if (!Schema::hasColumn('pedidos', 'user_id')) {
            Schema::table('pedidos', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('mesa_id')->constrained('users')->nullOnDelete();
            });
        }

        // Add team_id and user_id to cajas
        if (!Schema::hasColumn('cajas', 'team_id')) {
            Schema::table('cajas', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
                $table->index('team_id');
            });
        }

        if (!Schema::hasColumn('cajas', 'user_id')) {
            Schema::table('cajas', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('empleado')->constrained('users')->nullOnDelete();
            });
        }

        // Add team_id and user_id to deliveries
        if (!Schema::hasColumn('deliveries', 'team_id')) {
            Schema::table('deliveries', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->cascadeOnDelete();
                $table->index('team_id');
            });
        }

        if (!Schema::hasColumn('deliveries', 'user_id')) {
            Schema::table('deliveries', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('repartidor')->constrained('users')->nullOnDelete();
            });
        }

        // Add pin, is_active, and softDeletes to users
        if (!Schema::hasColumn('users', 'pin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('pin', 4)->nullable()->unique()->after('password');
            });
        }

        if (!Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_active')->default(true);
            });
        }

        if (!Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add operating hours to teams
        if (!Schema::hasColumn('teams', 'hora_apertura')) {
            Schema::table('teams', function (Blueprint $table) {
                $table->time('hora_apertura')->default('07:00')->after('is_personal');
                $table->time('hora_cierre')->default('23:00')->after('hora_apertura');
                $table->string('zona_horaria', 50)->default('America/Lima')->after('hora_cierre');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('platos', 'team_id')) {
            Schema::table('platos', function (Blueprint $table) {
                $table->dropConstrainedForeignId('team_id');
            });
        }

        if (Schema::hasColumn('mesas', 'team_id')) {
            Schema::table('mesas', function (Blueprint $table) {
                $table->dropConstrainedForeignId('team_id');
            });
        }

        if (Schema::hasColumn('mesas', 'user_id')) {
            Schema::table('mesas', function (Blueprint $table) {
                $table->dropConstrainedForeignId('user_id');
            });
        }

        if (Schema::hasColumn('pedidos', 'team_id')) {
            Schema::table('pedidos', function (Blueprint $table) {
                $table->dropConstrainedForeignId('team_id');
            });
        }

        if (Schema::hasColumn('pedidos', 'user_id')) {
            Schema::table('pedidos', function (Blueprint $table) {
                $table->dropConstrainedForeignId('user_id');
            });
        }

        if (Schema::hasColumn('cajas', 'team_id')) {
            Schema::table('cajas', function (Blueprint $table) {
                $table->dropConstrainedForeignId('team_id');
            });
        }

        if (Schema::hasColumn('cajas', 'user_id')) {
            Schema::table('cajas', function (Blueprint $table) {
                $table->dropConstrainedForeignId('user_id');
            });
        }

        if (Schema::hasColumn('deliveries', 'team_id')) {
            Schema::table('deliveries', function (Blueprint $table) {
                $table->dropConstrainedForeignId('team_id');
            });
        }

        if (Schema::hasColumn('deliveries', 'user_id')) {
            Schema::table('deliveries', function (Blueprint $table) {
                $table->dropConstrainedForeignId('user_id');
            });
        }

        if (Schema::hasColumn('users', 'pin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn(['pin', 'is_active', 'deleted_at']);
            });
        }

        if (Schema::hasColumn('teams', 'hora_apertura')) {
            Schema::table('teams', function (Blueprint $table) {
                $table->dropColumn(['hora_apertura', 'hora_cierre', 'zona_horaria']);
            });
        }
    }
};