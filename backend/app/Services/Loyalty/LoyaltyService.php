<?php

namespace App\Services\Loyalty;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Str;

/**
 * "Earn a R100 voucher every 5 paid washes" (spec §2.1). Called once per
 * newly-confirmed-paid booking; issues a voucher exactly when the customer's
 * total paid-wash count crosses a multiple of the threshold.
 *
 * Not idempotency-safe against duplicate calls for the same booking (e.g. a
 * retried gateway webhook) — fine for now since nothing calls this more than
 * once per payment confirmation, but worth revisiting once a real gateway
 * with webhook retries is wired in.
 */
class LoyaltyService
{
    public function checkAndIssueVoucher(User $user): ?Voucher
    {
        $settings = PlatformSetting::current();
        $threshold = $settings->voucher_wash_threshold;

        $totalPaidWashes = $user->bookings()
            ->where('payment_status', 'paid')
            ->where('counts_toward_voucher', true)
            ->count();

        if ($threshold <= 0 || $totalPaidWashes === 0 || $totalPaidWashes % $threshold !== 0) {
            return null;
        }

        return $user->vouchers()->create([
            'code' => 'WR-'.strtoupper(Str::random(8)),
            'amount' => $settings->voucher_amount,
            'status' => 'active',
            'source' => 'loyalty',
            'earned_at' => now(),
            'expires_at' => now()->addDays($settings->voucher_expiry_days),
        ]);
    }
}
