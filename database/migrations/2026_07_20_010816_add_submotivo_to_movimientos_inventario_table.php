<?php

   use Illuminate\Database\Migrations\Migration;
   use Illuminate\Database\Schema\Blueprint;
   use Illuminate\Support\Facades\Schema;

   return new class extends Migration
   {
       public function up(): void
       {
           Schema::table('movimientos_inventario', function (Blueprint $table) {
               $table->string('submotivo')->nullable()->after('motivo');
           });
       }

       public function down(): void
       {
           Schema::table('movimientos_inventario', function (Blueprint $table) {
               $table->dropColumn('submotivo');
           });
       }
   };