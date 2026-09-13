<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Services\Payments\FinalizeBookingPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * PayFast ITN (Instant Transaction Notification). Re-verify field names and
 * the "post back to PayFast to validate" step against current docs
 * (https://developers.payfast.co.za/docs#step_4_confirm_payment) before
 * go-live — this implementation validates the signature locally but does
 * not yet perform PayFast's recommended server-to-server confirmation call.
 */
class PayFastWebhookController extends Controller
{
    public function __invoke(Request $request, FinalizeBookingPayment $finalize)
    {
        $fields = $request->except('signature');
        $expected = $this->sign($fields, PlatformSetting::current()->payfast_passphrase);

        if (! hash_equals($expected, (string) $request->input('signature'))) {
            Log::warning('[payfast-webhook] signature mismatch', ['payment_id' => $request->input('m_payment_id')]);

            return response('invalid signature', 400);
        }

        if ($request->input('payment_status') !== 'COMPLETE') {
            return response('ok');
        }

        // m_payment_id is "WR-{bookingId}-{random}" — see PayFastGateway::charge().
        $bookingId = (int) explode('-', (string) $request->input('m_payment_id'))[1] ?? 0;
        $booking = Booking::query()->find($bookingId);

        if (! $booking) {
            Log::warning('[payfast-webhook] unknown booking', ['m_payment_id' => $request->input('m_payment_id')]);

            return response('unknown booking', 404);
        }

        $finalize->handle($booking, 'payfast', (string) $request->input('pf_payment_id'));

        return response('ok');
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
