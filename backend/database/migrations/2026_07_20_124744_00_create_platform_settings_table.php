<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('default_commission_rate', 5, 2)->default(15.00)
                ->comment('Percentage points applied when a tenant has no override');
            $table->unsignedTinyInteger('voucher_wash_threshold')->default(5)
                ->comment('Paid washes required to earn a loyalty voucher');
            $table->decimal('voucher_amount', 8, 2)->default(100.00);
            $table->unsignedSmallInteger('voucher_expiry_days')->default(90);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
