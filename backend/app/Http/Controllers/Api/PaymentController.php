<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Resources\VoucherResource;
use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Payments\Contracts\PaymentGateway;
use App\Services\Payments\FinalizeBookingPayment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentGateway $gateway,
        private readonly FinalizeBookingPayment $finalize,
    ) {}

    /**
     * Confirms payment for a booking. Synchronous gateways (sandbox, and any
     * card-token driver) finalize immediately here; redirect/async gateways
     * (PayFast/Paystack/Ozow hosted checkout) instead finalize from their
     * webhook controller once the gateway confirms success — see
     * App\Services\Payments\FinalizeBookingPayment, shared by both paths.
     */
    public function pay(Request $request, Booking $booking)
    {
        abort_unless($booking->user_id === $request->user()->id, 403);

        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'This booking has already been paid.'], 422);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'This booking has been cancelled.'], 422);
        }

        $result = $this->gateway->charge($booking, $request->input('payload', []));

        if (! $result->successful) {
            $booking->update(['payment_status' => 'failed']);

            return response()->json(['message' => $result->failureReason ?? 'Payment failed.'], 422);
        }

        // Hosted-checkout gateways return a redirect URL rather than an
        // immediate success — the booking stays pending until their webhook
        // confirms it (see e.g. Api\Webhooks\PayFastWebhookController).
        if ($result->redirectUrl) {
            return response()->json(['redirect_url' => $result->redirectUrl]);
        }

        $outcome = $this->finalize->handle($booking, PlatformSetting::effectivePaymentGateway(), $result->reference);

        return response()->json([
            'booking' => new BookingResource($outcome['booking']->load(['tenant', 'service', 'vehicle'])),
            'voucher_earned' => $outcome['voucher'] ? new VoucherResource($outcome['voucher']) : null,
        ]);
    }
}
