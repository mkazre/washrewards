<?php

namespace App\Services\Payments;

use App\Models\Booking;
use App\Models\Transaction;
use App\Models\Voucher;
use App\Notifications\AppNotification;
use App\Services\Loyalty\LoyaltyService;
use Illuminate\Support\Facades\DB;

/**
 * The one place a booking is actually marked paid and ledgered — shared by
 * PaymentController::pay() (the synchronous sandbox/card-token flow) and
 * every gateway webhook controller (PayFast/Paystack/Ozow — async, redirect-
 * based flows that only know a payment succeeded once their webhook fires).
 * Wrapped in a DB transaction and safe to call more than once for the same
 * booking: a webhook retry re-finalizing an already-paid booking is a no-op,
 * and LoyaltyService::checkAndIssueVoucher is itself idempotent per booking.
 */
class FinalizeBookingPayment
{
    public function __construct(
        private readonly CommissionSplitCalculator $calculator,
        private readonly LoyaltyService $loyalty,
    ) {}

    /**
     * @return array{booking: Booking, voucher: ?Voucher, already_finalized: bool}
     */
    public function handle(Booking $booking, string $gateway, string $gatewayReference): array
    {
        if ($booking->payment_status === 'paid') {
            return ['booking' => $booking, 'voucher' => null, 'already_finalized' => true];
        }

        $split = $this->calculator->calculate($booking);
        $voucher = null;

        DB::transaction(function () use ($booking, $gateway, $gatewayReference, $split, &$voucher) {
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
                'gateway' => $gateway,
                'gateway_reference' => $gatewayReference,
                'status' => 'completed',
            ]);

            $voucher = $this->loyalty->checkAndIssueVoucher($booking->user, $booking);
        });

        $booking = $booking->fresh(['tenant', 'service', 'user']);

        $booking->user->notify(new AppNotification(
            'Payment successful',
            "Your {$booking->service?->name} at {$booking->tenant?->name} is booked and paid.",
            ['type' => 'booking_paid', 'booking_id' => $booking->id]
        ));

        if ($voucher) {
            $booking->user->notify(new AppNotification(
                'You earned a voucher!',
                "R{$voucher->amount} wash voucher added to your wallet.",
                ['type' => 'voucher_earned', 'voucher_id' => $voucher->id]
            ));
        }

        if ($booking->tenant) {
            foreach ($booking->tenant->users as $partnerUser) {
                $partnerUser->notify(new AppNotification(
                    'New booking',
                    "{$booking->user->name} booked {$booking->service?->name} for ".$booking->scheduled_at->format('D, H:i').'.',
                    ['type' => 'partner_new_booking', 'booking_id' => $booking->id]
                ));
            }
        }

        return ['booking' => $booking, 'voucher' => $voucher, 'already_finalized' => false];
    }
}
