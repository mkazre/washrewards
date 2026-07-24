<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('settlement_id')->nullable()->constrained()->nullOnDelete();

            $table->decimal('gross_amount', 8, 2)->comment('Total the customer paid');
            $table->decimal('platform_commission', 8, 2);
            $table->decimal('voucher_contribution', 8, 2)->default(0)
                ->comment('Portion of commission that funds the R100 loyalty pool');
            $table->decimal('partner_earnings', 8, 2)
                ->comment('gross_amount - platform_commission (includes travel fee for mobile wash)');

            $table->enum('gateway', ['payfast', 'peach_payments', 'paystack', 'yoco', 'ozow']);
            $table->string('gateway_reference')->nullable()
                ->comment('External payment reference only — never raw card data (PCI-DSS SAQ-A)');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('settlement_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
