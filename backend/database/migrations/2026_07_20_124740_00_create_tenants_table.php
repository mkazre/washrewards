<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('type', ['fixed_garage', 'mobile_wash']);
            $table->text('description')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('cover_photo_path')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->decimal('commission_rate', 5, 2)->nullable()
                ->comment('Percentage points; null = use platform default');
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('rating_count')->default(0);

            // Fixed garage: storefront location.
            $table->string('address')->nullable();
            $table->string('suburb')->nullable();
            $table->string('city')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Mobile wash: service area instead of a fixed pin.
            $table->json('service_areas')->nullable()
                ->comment('List of suburb/area names the mobile wash covers');
            $table->decimal('travel_radius_km', 6, 2)->nullable();
            $table->decimal('travel_fee', 8, 2)->nullable()
                ->comment('Default call-out fee; can be overridden per booking');

            $table->json('opening_hours')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('type');
            $table->index('status');
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
