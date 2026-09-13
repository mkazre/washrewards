<?php

namespace App\Payments\Drivers;

use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Payments\Contracts\PaymentGateway;
use App\Payments\PaymentResult;
use Illuminate\Support\Str;

/**
 * PayFast hosted-checkout redirect. Credentials come from the admin Settings
 * page (PlatformSetting::payfast_*), not .env — see PlatformSetting::
 * effectivePaymentGateway(), which silently falls back to sandbox if these
 * are empty. Field names/order/signature follow PayFast's "process" hosted
 * page integration (https://developers.payfast.co.za) as of this writing —
 * re-verify against current docs before go-live, since this can't be tested
 * end-to-end without real merchant credentials.
 *
 * charge() only builds the signed redirect — PaymentController redirects the
 * customer there, and the booking is finalized later by
 * Api\Webhooks\PayFastWebhookController once PayFast's ITN (webhook) fires.
 */
class PayFastGateway implements PaymentGateway
{
    public function charge(Booking $booking, array $payload = []): PaymentResult
    {
        $settings = PlatformSetting::current();
        $paymentId = 'WR-'.$booking->id.'-'.Str::random(6);

        $fields = [
            'merchant_id' => $settings->payfast_merchant_id,
            'merchant_key' => $settings->payfast_merchant_key,
            'return_url' => config('app.url').'/payments/payfast/return',
            'cancel_url' => config('app.url').'/payments/payfast/cancel',
            'notify_url' => config('app.url').'/api/webhooks/payfast',
            'm_payment_id' => $paymentId,
            'amount' => number_format((float) $booking->total_amount, 2, '.', ''),
            'item_name' => 'WashRewards booking #'.$booking->id,
        ];

        $signature = $this->sign($fields, $settings->payfast_passphrase);
        $fields['signature'] = $signature;

        $baseUrl = app()->environment('production')
            ? 'https://www.payfast.co.za/eng/process'
            : 'https://sandbox.payfast.co.za/eng/process';

        return new PaymentResult(
            successful: true,
            reference: $paymentId,
            redirectUrl: $baseUrl.'?'.http_build_query($fields),
        );
    }

    private function sign(array $fields, ?string $passphrase): string
    {
        $pairs = [];
        foreach ($fields as $key => $value) {
            if ($value !== null && $value !== '') {
                $pairs[] = $key.'='.urlencode((string) $value);
            }
        }

        $query = implode('&', $pairs);

        if (! blank($passphrase)) {
            $query .= '&passphrase='.urlencode($passphrase);
        }

        return md5($query);
    }
}
