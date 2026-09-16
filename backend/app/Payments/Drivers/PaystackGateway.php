<?php

namespace App\Payments\Drivers;

use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Payments\Contracts\PaymentGateway;
use App\Payments\PaymentResult;
use App\Payments\PaymentReturnUrls;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Paystack hosted-checkout via the Transaction Initialize REST API
 * (https://paystack.com/docs/api/transaction/#initialize). Credentials come
 * from the admin Settings page, not .env — see PlatformSetting::
 * effectivePaymentGateway(). Re-verify the request/response shape against
 * current Paystack docs before go-live; this can't be tested end-to-end
 * without a real secret key.
 *
 * charge() only initializes the transaction and returns the redirect —
 * PaymentController redirects the customer there, and the booking is
 * finalized later by Api\Webhooks\PaystackWebhookController once Paystack's
 * `charge.success` webhook fires.
 */
class PaystackGateway implements PaymentGateway
{
    public function charge(Booking $booking, array $payload = []): PaymentResult
    {
        $settings = PlatformSetting::current();
        $reference = 'WR-'.$booking->id.'-'.Str::random(8);

        $response = Http::withToken($settings->paystack_secret_key)
            ->post('https://api.paystack.co/transaction/initialize', [
                'email' => $booking->user->email,
                // Paystack amounts are in the smallest currency unit (cents).
                'amount' => (int) round(((float) $booking->total_amount) * 100),
                'currency' => 'ZAR',
                'reference' => $reference,
                // Paystack redirects here regardless of outcome — status is
                // determined by re-checking the booking, not this query string.
                'callback_url' => PaymentReturnUrls::success($booking->id),
                'metadata' => ['booking_id' => $booking->id],
            ]);

        if (! $response->successful() || ! $response->json('status')) {
            return new PaymentResult(
                successful: false,
                reference: $reference,
                failureReason: $response->json('message') ?? 'Paystack could not initialize this payment.',
            );
        }

        return new PaymentResult(
            successful: true,
            reference: $reference,
            redirectUrl: $response->json('data.authorization_url'),
        );
    }
}
