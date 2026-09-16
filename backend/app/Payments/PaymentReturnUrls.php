<?php

namespace App\Payments;

/**
 * Where a hosted-checkout gateway (PayFast/Paystack/Ozow) sends the
 * customer's browser after they finish on the gateway's own page. This
 * points straight at the mobile app's custom URL scheme (see `scheme` in
 * mobile/app.config.ts) — there's no website checkout flow for these to
 * land on, only the app.
 *
 * The query string is a hint for the app's UI, never proof of payment: the
 * app must always re-fetch the booking and check its real payment_status,
 * since the gateway's webhook — not this redirect — is what actually
 * finalizes payment. A user can close the in-app browser before the
 * redirect fires at all, or the webhook can lag behind it.
 */
class PaymentReturnUrls
{
    private const SCHEME = 'washrewards://payment-return';

    public static function success(int|string $bookingId): string
    {
        return self::SCHEME.'?booking_id='.$bookingId.'&status=success';
    }

    public static function cancel(int|string $bookingId): string
    {
        return self::SCHEME.'?booking_id='.$bookingId.'&status=cancelled';
    }

    public static function error(int|string $bookingId): string
    {
        return self::SCHEME.'?booking_id='.$bookingId.'&status=error';
    }
}
