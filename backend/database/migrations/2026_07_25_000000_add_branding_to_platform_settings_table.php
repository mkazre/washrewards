<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('voucher_expiry_days')
                ->comment('Admin panel brand logo');
            $table->string('favicon_path')->nullable()->after('logo_path')
                ->comment('Browser favicon for the admin panel');
            $table->string('login_background_path')->nullable()->after('favicon_path')
                ->comment('Background image for the admin login page');
            $table->boolean('login_overlay_enabled')->default(false)->after('login_background_path');
            $table->string('login_overlay_color', 32)->default('#091830')->after('login_overlay_enabled');
            $table->unsignedTinyInteger('login_overlay_opacity')->default(40)->after('login_overlay_color')
                ->comment('Overlay opacity 0-100 over the login background');
        });
    }

    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn([
                'logo_path',
                'favicon_path',
                'login_background_path',
                'login_overlay_enabled',
                'login_overlay_color',
                'login_overlay_opacity',
            ]);
        });
    }
};
