<?php

namespace App\Services\Payments;

use App\Models\Booking;
use App\Models\PlatformSetting;

/**
 * Splits a paid booking into partner earnings, platform commission, and a
 * voucher-pool contribution. Commission is charged on the service price only
 * — mobile-wash travel fees pass through to the partner in full, per the
 * spec's "mobile-wash payouts include any travel fee collected" (§2.5). The
 * voucher contribution is a share of the commission, not of gross.
 */
class CommissionSplitCalculator
{
    public function calculate(Booking $booking): CommissionSplit
    {
        $settings = PlatformSetting::current();

        $commissionRate = (float) ($booking->tenant->commission_rate ?? $settings->default_commission_rate);
        $voucherContributionRate = (float) $settings->voucher_contribution_rate;

        $price = (float) $booking->price;
        $travelFee = (float) $booking->travel_fee;
        $gross = round($price + $travelFee, 2);

        $commission = round($price * $commissionRate / 100, 2);
        $voucherContribution = round($commission * $voucherContributionRate / 100, 2);
        $partnerEarnings = round($gross - $commission, 2);

        return new CommissionSplit($gross, $commission, $voucherContribution, $partnerEarnings);
    }
}
