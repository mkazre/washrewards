<?php

namespace App\Payments\Drivers;

use App\Models\Booking;
use App\Payments\Contracts\PaymentGateway;
use App\Payments\PaymentResult;
use Illuminate\Support\Str;

/**
 * Stand-in gateway for local dev/testing until a real SA gateway is chosen
 * and its API keys are provided (see App\Payments\Contracts\PaymentGateway).
 * Always succeeds synchronously with a clearly-fake reference — never used
 * unless PAYMENT_GATEWAY=sandbox (the default outside of a real driver being
 * configured), so it can never be mistaken for a real charge in transaction
 * records: 'sandbox' is its own value in transactions.gateway, distinct from
 * every real gateway enum value.
 */
class SandboxGateway implements PaymentGateway
{
    public function charge(Booking $booking, array $payload = []): PaymentResult
    {
        return new PaymentResult(
            successful: true,
            reference: 'SANDBOX-'.strtoupper(Str::random(12)),
        );
    }
}
