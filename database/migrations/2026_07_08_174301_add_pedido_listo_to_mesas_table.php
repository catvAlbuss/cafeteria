<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('mesas', function (Blueprint $table) {
            $table->boolean('pedido_listo')->default(false)->after('estado');
        });
    }

    public function down()
    {
        Schema::table('mesas', function (Blueprint $table) {
            $table->dropColumn('pedido_listo');
        });
    }
};
