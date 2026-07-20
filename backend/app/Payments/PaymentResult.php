<?php

namespace App\Payments;

final class PaymentResult
{
    public function __construct(
        public readonly bool $successful,
        public readonly string $reference,
        public readonly ?string $failureReason = null,
    ) {}
}
