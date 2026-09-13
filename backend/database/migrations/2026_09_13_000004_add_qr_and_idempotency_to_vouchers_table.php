<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * qr_token: what the wallet screen renders as a QR code and a partner scans
 * to redeem (see Partner\VoucherController) — separate from the human-typed
 * `code`, since a QR payload shouldn't double as a support-readable code.
 *
 * earned_booking_id: fixes LoyaltyService::checkAndIssueVoucher's noted
 * idempotency gap — a loyalty voucher now records which booking triggered
 * it, so a retried payment-confirmation (e.g. a gateway webhook retry) can't
 * issue a second voucher for the same wash-count crossing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('qr_token')->nullable()->unique()->after('code');
            $table->foreignId('earned_booking_id')->nullable()->after('redeemed_booking_id')
                ->constrained('bookings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('earned_booking_id');
            $table->dropColumn('qr_token');
        });
    }
};
