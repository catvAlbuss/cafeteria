<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mesas', function (Blueprint $table) {
            $table->string('mesero')->nullable()->after('personas');
        });
    }

    public function down(): void
    {
        Schema::table('mesas', function (Blueprint $table) {
            $table->dropColumn('mesero');
        });
    }
};