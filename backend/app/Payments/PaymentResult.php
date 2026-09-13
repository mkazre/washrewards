<?php

namespace App\Payments;

final class PaymentResult
{
    public function __construct(
        public readonly bool $successful,
        public readonly string $reference,
        public readonly ?string $failureReason = null,
        /**
         * Set by hosted-checkout drivers (PayFast/Paystack/Ozow) — the
         * client must redirect the customer here to complete payment. The
         * booking is only finalized later, from that gateway's webhook, not
         * from this initial charge() call. Synchronous drivers (sandbox)
         * leave this null and are finalized immediately.
         */
        public readonly ?string $redirectUrl = null,
    ) {}
}
