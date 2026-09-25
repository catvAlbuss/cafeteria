<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('correlativos_control', function (Blueprint $table) {
            $table->id();
            $table->string('serie')->unique();
            $table->unsignedInteger('ultimo_correlativo')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('correlativos_control');
    }
};  