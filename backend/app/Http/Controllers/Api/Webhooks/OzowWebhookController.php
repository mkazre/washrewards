<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Services\Payments\FinalizeBookingPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Ozow notify webhook (https://ozow.com/developer-portal). Re-verify the
 * exact notify-payload field set/order against current docs before go-live
 * — this implements the commonly-documented shape but hasn't been tested
 * against a real Ozow account.
 */
class OzowWebhookController extends Controller
{
    public function __invoke(Request $request, FinalizeBookingPayment $finalize)
    {
        $privateKey = (string) PlatformSetting::current()->ozow_private_key;

        $fields = [
            'SiteCode' => $request->input('SiteCode'),
            'TransactionId' => $request->input('TransactionId'),
            'TransactionReference' => $request->input('TransactionReference'),
            'Amount' => $request->input('Amount'),
            'Status' => $request->input('Status'),
            'Optional1' => $request->input('Optional1'),
            'Optional2' => $request->input('Optional2'),
            'Optional3' => $request->input('Optional3'),
            'Optional4' => $request->input('Optional4'),
            'Optional5' => $request->input('Optional5'),
            'CurrencyCode' => $request->input('CurrencyCode'),
            'IsTest' => $request->input('IsTest'),
            'StatusMessage' => $request->input('StatusMessage'),
        ];

        $expected = hash('sha512', mb_strtolower(implode('', array_map(fn ($v) => (string) $v, $fields)).$privateKey));

        if (! hash_equals($expected, mb_strtolower((string) $request->input('Hash')))) {
            Log::warning('[ozow-webhook] hash mismatch', ['reference' => $fields['TransactionReference']]);

            return response('invalid hash', 400);
        }

        if ($fields['Status'] !== 'Complete') {
            return response('ok');
        }

        // TransactionReference is "WR-{bookingId}-{random}" — see OzowGateway::charge().
        $bookingId = (int) explode('-', (string) $fields['TransactionReference'])[1] ?? 0;
        $booking = Booking::query()->find($bookingId);

        if (! $booking) {
            Log::warning('[ozow-webhook] unknown booking', ['reference' => $fields['TransactionReference']]);

            return response('unknown booking', 404);
        }

        $finalize->handle($booking, 'ozow', (string) $fields['TransactionId']);

        return response('ok');
    }
}
