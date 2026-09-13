<?php

namespace App\Payments\Drivers;

use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Payments\Contracts\PaymentGateway;
use App\Payments\PaymentResult;
use Illuminate\Support\Str;

/**
 * Ozow hosted-checkout (instant EFT) via a SHA512-signed redirect
 * (https://ozow.com/developer-portal — "Post & Redirect" integration).
 * Credentials come from the admin Settings page, not .env — see
 * PlatformSetting::effectivePaymentGateway(). Re-verify field order/hash
 * algorithm against current Ozow docs before go-live; this can't be tested
 * end-to-end without a real site code/API key.
 *
 * charge() only builds the signed redirect — PaymentController redirects the
 * customer there, and the booking is finalized later by
 * Api\Webhooks\OzowWebhookController once Ozow's notify webhook fires.
 */
class OzowGateway implements PaymentGateway
{
    public function charge(Booking $booking, array $payload = []): PaymentResult
    {
        $settings = PlatformSetting::current();
        $reference = 'WR-'.$booking->id.'-'.Str::random(8);
        $isTest = app()->environment('production') ? 'false' : 'true';

        // Order matters for the hash — Ozow hashes every field's *value*,
        // in this exact sequence, before appending the private key.
        $fields = [
            'SiteCode' => $settings->ozow_site_code,
            'CountryCode' => 'ZA',
            'CurrencyCode' => 'ZAR',
            'Amount' => number_format((float) $booking->total_amount, 2, '.', ''),
            'TransactionReference' => $reference,
            'BankReference' => 'WashRewards',
            'CancelUrl' => config('app.url').'/payments/ozow/cancel',
            'ErrorUrl' => config('app.url').'/payments/ozow/error',
            'SuccessUrl' => config('app.url').'/payments/ozow/return',
            'NotifyUrl' => config('app.url').'/api/webhooks/ozow',
            'IsTest' => $isTest,
        ];

        $fields['HashCheck'] = $this->hash($fields, $settings->ozow_private_key);

        return new PaymentResult(
            successful: true,
            reference: $reference,
            redirectUrl: 'https://pay.ozow.com/?'.http_build_query($fields),
        );
    }

    private function hash(array $fields, ?string $privateKey): string
    {
        $concatenated = implode('', array_map('strval', $fields)).($privateKey ?? '');

        return hash('sha512', mb_strtolower($concatenated));
    }
}
