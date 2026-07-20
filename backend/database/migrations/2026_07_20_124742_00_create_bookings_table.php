<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->enum('status', [
                'pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled',
            ])->default('pending');
            $table->dateTime('scheduled_at');

            // Mobile wash only: where the washer travels to for this booking.
            $table->text('service_address')->nullable();
            $table->decimal('service_latitude', 10, 7)->nullable();
            $table->decimal('service_longitude', 10, 7)->nullable();

            $table->decimal('price', 8, 2)->comment('Service price snapshot at booking time');
            $table->decimal('travel_fee', 8, 2)->default(0);
            $table->decimal('total_amount', 8, 2);

            $table->enum('payment_status', ['pending', 'paid', 'refunded', 'failed'])->default('pending');
            $table->enum('payment_method', ['card', 'eft'])->nullable();
            $table->boolean('counts_toward_voucher')->default(false);

            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('user_id');
            $table->index(['tenant_id', 'scheduled_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
