<?php

namespace App\Payments\Contracts;

use App\Models\Booking;
use App\Payments\PaymentResult;

/**
 * Abstraction over the (not-yet-chosen) South African payment gateway —
 * PayFast / Peach Payments / Paystack / Yoco / Ozow — per the spec's open
 * question on which one to integrate. Business logic (ledger, commission
 * split, loyalty) depends only on this interface, so swapping in the real
 * gateway later is a single new driver class, not a rewrite.
 */
interface PaymentGateway
{
    /**
     * Charge the customer for a booking. $payload carries whatever the
     * client-side gateway SDK produced (a card token, EFT redirect result,
     * etc.) — shape is driver-specific.
     */
    public function charge(Booking $booking, array $payload = []): PaymentResult;
}
