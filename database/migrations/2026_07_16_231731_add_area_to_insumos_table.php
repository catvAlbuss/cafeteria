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
            $table->enum('area', ['cocina', 'bar'])->default('cocina')->after('categoria');
            $table->index(['team_id', 'area', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('insumos', function (Blueprint $table) {
            $table->dropIndex(['team_id', 'area', 'activo']);
            $table->dropColumn('area');
        });
    }
};
