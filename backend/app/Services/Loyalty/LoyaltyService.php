<?php

namespace App\Services\Loyalty;

use App\Models\Booking;
use App\Models\LoyaltyTier;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Str;

/**
 * Two independent loyalty mechanics share this service:
 *
 * 1. "Earn a R100 voucher every N paid washes" (flat threshold, admin-
 *    configurable via PlatformSetting) — checkAndIssueVoucher() below.
 * 2. Tiers/levels (Bronze..Black) computed from a rolling 90-day paid-wash
 *    count, purely a progress/status display — currentTier() below. Tiers
 *    don't themselves grant vouchers; they're the Rewards screen's "level"
 *    concept layered on top of mechanic 1.
 */
class LoyaltyService
{
    /**
     * Idempotent per booking: pass the Booking whose payment just confirmed,
     * and a voucher is issued at most once for that specific wash-count
     * crossing — safe against a retried gateway webhook confirming the same
     * payment twice.
     */
    public function checkAndIssueVoucher(User $user, Booking $booking): ?Voucher
    {
        if (Voucher::query()->where('earned_booking_id', $booking->id)->exists()) {
            return null;
        }

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
            'earned_booking_id' => $booking->id,
            'earned_at' => now(),
            'expires_at' => now()->addDays($settings->voucher_expiry_days),
        ]);
    }

    /**
     * @return array{tier: LoyaltyTier, month_washes: int, next_tier: ?LoyaltyTier, next_threshold: int, level_pct: int, tiers: \Illuminate\Support\Collection<int, LoyaltyTier>}
     */
    public function currentTier(User $user): array
    {
        $monthWashes = $user->bookings()
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', now()->subDays(90))
            ->count();

        $tiers = LoyaltyTier::query()->orderBy('sort_order')->get();

        $tier = $tiers->filter(fn (LoyaltyTier $t) => $monthWashes >= $t->washes_required)->last()
            ?? $tiers->first();

        $nextTier = $tiers->first(fn (LoyaltyTier $t) => $t->washes_required > $monthWashes);
        $nextThreshold = $nextTier?->washes_required ?? $tier?->washes_required ?? 0;
        $levelPct = $nextThreshold > 0 ? (int) min(100, round($monthWashes / $nextThreshold * 100)) : 100;

        return [
            'tier' => $tier,
            'month_washes' => $monthWashes,
            'next_tier' => $nextTier,
            'next_threshold' => $nextThreshold,
            'level_pct' => $levelPct,
            'tiers' => $tiers,
        ];
    }
}
