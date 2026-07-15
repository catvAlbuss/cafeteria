<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->enum('area', ['cocina', 'bar', 'horno', 'postres'])
                  ->nullable()
                  ->after('estado');
            
            $table->index(['area', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropIndex(['area', 'estado']);
            $table->dropColumn('area');
        });
    }
};