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
        Schema::create('inventarios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150);
            $table->string('codigo', 255)->unique();
            $table->text('especificaciones')->nullable();
            $table->string('marca', 100);
            $table->decimal('stock', 10, 2);
            $table->decimal('cant_mant', 10, 2);
            $table->dateTime('mant_1');
            $table->dateTime('mant_2');
            $table->dateTime('mant_3');
            $table->dateTime('mant_4');
            $table->dateTime('mant_5');
            $table->dateTime('mant_6');
            $table->dateTime('mant_7');
            $table->dateTime('mant_8');
            $table->dateTime('mant_9');
            $table->dateTime('mant_10');
            $table->foreignId('areas_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventarios');
    }
};
