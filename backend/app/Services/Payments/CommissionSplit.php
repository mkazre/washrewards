<?php

namespace App\Services\Payments;

/**
 * Result of splitting a booking's total into partner earnings, platform
 * commission, and the voucher-pool contribution, per the spec's
 * collect-and-settle model (§2.5).
 */
final class CommissionSplit
{
    public function __construct(
        public readonly float $grossAmount,
        public readonly float $platformCommission,
        public readonly float $voucherContribution,
        public readonly float $partnerEarnings,
    ) {}
}
