<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Resources\VoucherResource;
use App\Models\Booking;
use App\Models\Transaction;
use App\Payments\Contracts\PaymentGateway;
use App\Services\Loyalty\LoyaltyService;
use App\Services\Payments\CommissionSplitCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentGateway $gateway,
        private readonly CommissionSplitCalculator $calculator,
        private readonly LoyaltyService $loyalty,
    ) {}

    /**
     * Confirms payment for a booking: charges via the configured gateway,
     * records the ledger split, and checks whether this payment just earned
     * a loyalty voucher. See App\Payments\Contracts\PaymentGateway for why
     * this defaults to a sandbox charge rather than a real one.
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

        $split = $this->calculator->calculate($booking);
        $voucher = null;

        DB::transaction(function () use ($booking, $result, $split, &$voucher) {
            $booking->update([
                'payment_status' => 'paid',
                'status' => $booking->status === 'pending' ? 'confirmed' : $booking->status,
                'counts_toward_voucher' => true,
            ]);

            Transaction::create([
                'tenant_id' => $booking->tenant_id,
                'booking_id' => $booking->id,
                'user_id' => $booking->user_id,
                'gross_amount' => $split->grossAmount,
                'platform_commission' => $split->platformCommission,
                'voucher_contribution' => $split->voucherContribution,
                'partner_earnings' => $split->partnerEarnings,
                'gateway' => config('payments.default'),
                'gateway_reference' => $result->reference,
                'status' => 'completed',
            ]);

            $voucher = $this->loyalty->checkAndIssueVoucher($booking->user);
        });

        return response()->json([
            'booking' => new BookingResource($booking->fresh(['tenant', 'service', 'vehicle'])),
            'voucher_earned' => $voucher ? new VoucherResource($voucher) : null,
        ]);
    }
}
