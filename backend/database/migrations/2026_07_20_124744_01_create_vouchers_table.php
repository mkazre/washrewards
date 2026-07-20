<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code')->unique();
            $table->decimal('amount', 8, 2)->default(100.00);
            $table->enum('status', ['active', 'redeemed', 'expired'])->default('active');
            $table->enum('source', ['loyalty', 'promotion', 'admin_grant'])->default('loyalty');
            $table->foreignId('redeemed_booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->timestamp('earned_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('redeemed_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
