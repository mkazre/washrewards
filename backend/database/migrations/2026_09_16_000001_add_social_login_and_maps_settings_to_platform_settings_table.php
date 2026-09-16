<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->boolean('google_login_enabled')->default(false);
            $table->string('google_client_id')->nullable();

            $table->boolean('apple_login_enabled')->default(false);
            $table->string('apple_client_id')->nullable()->comment('Sign in with Apple Services ID, used as the JWT audience');
            $table->string('apple_team_id')->nullable();
            $table->string('apple_key_id')->nullable();
            $table->text('apple_private_key')->nullable()->comment('.p8 key contents — only needed if you add server-to-Apple calls later; token verification itself uses Apple\'s public JWKS');

            $table->boolean('facebook_login_enabled')->default(false);
            $table->string('facebook_app_id')->nullable();
            $table->string('facebook_app_secret')->nullable();

            $table->boolean('maps_enabled')->default(false);
            $table->string('aws_location_map_name')->nullable();
            $table->string('aws_location_region')->nullable();
            $table->string('aws_location_api_key')->nullable();

            $table->string('expo_access_token')->nullable()->comment('Optional — raises Expo push API rate limits, not required for push to work');
        });
    }

    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn([
                'google_login_enabled',
                'google_client_id',
                'apple_login_enabled',
                'apple_client_id',
                'apple_team_id',
                'apple_key_id',
                'apple_private_key',
                'facebook_login_enabled',
                'facebook_app_id',
                'facebook_app_secret',
                'maps_enabled',
                'aws_location_map_name',
                'aws_location_region',
                'aws_location_api_key',
                'expo_access_token',
            ]);
        });
    }
};
