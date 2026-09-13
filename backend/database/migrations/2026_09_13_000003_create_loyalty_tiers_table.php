<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Loyalty tiers (Bronze..Black) computed from a customer's rolling 90-day
 * paid-wash count — a level/progress layer on top of the existing flat "N
 * washes = R100 voucher" engine (unchanged, see LoyaltyService), matching
 * the redesigned mobile app's Rewards screen.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_tiers', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('level')->unique();
            $table->string('name');
            $table->unsignedInteger('washes_required');
            $table->string('reward_description');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_tiers');
    }
};
