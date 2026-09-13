<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Services\Payments\FinalizeBookingPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Paystack webhook (https://paystack.com/docs/payments/webhooks). Verifies
 * the `x-paystack-signature` header (HMAC-SHA512 of the raw body, keyed with
 * the secret key) before trusting the payload.
 */
class PaystackWebhookController extends Controller
{
    public function __invoke(Request $request, FinalizeBookingPayment $finalize)
    {
        $secret = (string) PlatformSetting::current()->paystack_secret_key;
        $signature = hash_hmac('sha512', $request->getContent(), $secret);

        if (! hash_equals($signature, (string) $request->header('x-paystack-signature'))) {
            Log::warning('[paystack-webhook] signature mismatch');

            return response('invalid signature', 400);
        }

        $event = $request->input('event');
        $data = $request->input('data', []);

        if ($event !== 'charge.success' || ($data['status'] ?? null) !== 'success') {
            return response('ok');
        }

        // reference is "WR-{bookingId}-{random}" — see PaystackGateway::charge().
        $bookingId = (int) explode('-', (string) ($data['reference'] ?? ''))[1] ?? 0;
        $booking = Booking::query()->find($bookingId);

        if (! $booking) {
            Log::warning('[paystack-webhook] unknown booking', ['reference' => $data['reference'] ?? null]);

            return response('unknown booking', 404);
        }

        $finalize->handle($booking, 'paystack', (string) ($data['reference'] ?? ''));

        return response('ok');
    }
}
