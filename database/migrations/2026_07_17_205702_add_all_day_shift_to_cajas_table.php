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
        Schema::table('cajas', function (Blueprint $table) {
            $table->enum('turno', ['Todo el día', 'Mañana', 'Tarde', 'Noche'])
                ->default('Todo el día')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cajas', function (Blueprint $table) {
            $table->enum('turno', ['Mañana', 'Tarde', 'Noche'])
                ->default('Mañana')
                ->change();
        });
    }
};
