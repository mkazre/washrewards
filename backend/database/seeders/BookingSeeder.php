<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Promotion;
use App\Models\Review;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $sparkle = Tenant::where('slug', 'sparkle-shine')->firstOrFail();
        $prestige = Tenant::where('slug', 'prestige-wash-co')->firstOrFail();
        $driveClean = Tenant::where('slug', 'driveclean-express')->firstOrFail();
        $aquaJet = Tenant::where('slug', 'aquajet-auto-spa')->firstOrFail();

        $sanele = User::where('email', 'sanele@example.com')->firstOrFail();

        // Sanele's booking history — drives the "3 of 5 washes" loyalty progress
        // and the "rate your recent wash" prompt (most recent, unreviewed).
        $this->completedBooking($sanele, $prestige, 'Premium Detail', Carbon::now()->subDays(2));
        $this->completedBooking($sanele, $sparkle, 'Full Valet', Carbon::now()->subDays(12));
        $this->completedBooking($sanele, $driveClean, 'Basic Wash', Carbon::now()->subDays(19));

        Voucher::updateOrCreate(
            ['user_id' => $sanele->id, 'earned_at' => Carbon::now()->subDays(53)],
            [
                'code' => 'WR-'.strtoupper(Str::random(8)),
                'amount' => 100.00,
                'status' => 'active',
                'source' => 'loyalty',
                'expires_at' => Carbon::now()->subDays(53)->addDays(90),
            ]
        );

        // Sparkle & Shine's "today's bookings" board on the partner dashboard.
        $today = Carbon::today();

        $this->completedBooking(
            User::where('email', 'thabo@example.com')->firstOrFail(),
            $sparkle,
            'Full Valet',
            $today->copy()->setTime(9, 30),
        );

        $this->booking(
            User::where('email', 'lerato@example.com')->firstOrFail(),
            $sparkle,
            'Basic Wash',
            $today->copy()->setTime(11, 0),
            status: 'checked_in',
            checkedIn: true,
        );

        $this->booking(
            User::where('email', 'sipho@example.com')->firstOrFail(),
            $sparkle,
            'Premium Detail',
            $today->copy()->setTime(12, 30),
            status: 'confirmed',
        );

        $this->booking(
            User::where('email', 'aisha@example.com')->firstOrFail(),
            $sparkle,
            'Full Valet',
            $today->copy()->setTime(14, 0),
            status: 'confirmed',
        );

        // Verified reviews shown on Sparkle & Shine's booking page.
        $this->reviewedBooking(
            User::where('email', 'naledi@example.com')->firstOrFail(),
            $sparkle,
            'Full Valet',
            Carbon::now()->subDays(2),
            rating: 5,
            comment: 'Spotless finish and done in 40 minutes. Booking made it effortless.',
        );

        $this->reviewedBooking(
            User::where('email', 'johan@example.com')->firstOrFail(),
            $sparkle,
            'Full Valet',
            Carbon::now()->subDays(5),
            rating: 5,
            comment: 'Great value valet — staff were professional and friendly.',
        );

        // "Weekend offer" push notification shown on the consumer home screen.
        $weekend = Carbon::now()->next(Carbon::SATURDAY);

        Promotion::updateOrCreate(
            ['tenant_id' => $aquaJet->id, 'title' => 'Weekend Offer'],
            [
                'description' => '20% off all packages this weekend only.',
                'discount_type' => 'percent',
                'discount_value' => 20.00,
                'starts_at' => $weekend->copy()->startOfDay(),
                'ends_at' => $weekend->copy()->addDay()->endOfDay(),
                'is_active' => true,
            ]
        );
    }

    private function completedBooking(User $user, Tenant $tenant, string $serviceName, Carbon $scheduledAt): Booking
    {
        return $this->booking($user, $tenant, $serviceName, $scheduledAt, status: 'completed', checkedIn: true, completed: true);
    }

    private function reviewedBooking(
        User $user,
        Tenant $tenant,
        string $serviceName,
        Carbon $scheduledAt,
        int $rating,
        string $comment,
    ): Booking {
        $booking = $this->completedBooking($user, $tenant, $serviceName, $scheduledAt);

        $review = Review::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'rating' => $rating,
                'comment' => $comment,
                'is_verified' => true,
            ]
        );
        $review->forceFill(['created_at' => $scheduledAt, 'updated_at' => $scheduledAt])->save();

        return $booking;
    }

    private function booking(
        User $user,
        Tenant $tenant,
        string $serviceName,
        Carbon $scheduledAt,
        string $status,
        bool $checkedIn = false,
        bool $completed = false,
    ): Booking {
        $service = Service::where('tenant_id', $tenant->id)->where('name', $serviceName)->firstOrFail();
        $travelFee = $tenant->isMobileWash() ? (float) $tenant->travel_fee : 0;

        $booking = Booking::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'service_id' => $service->id,
                'scheduled_at' => $scheduledAt,
            ],
            [
                'vehicle_id' => $user->vehicles()->value('id'),
                'status' => $status,
                'price' => $service->price,
                'travel_fee' => $travelFee,
                'total_amount' => $service->price + $travelFee,
                'payment_status' => 'paid',
                'payment_method' => 'card',
                'counts_toward_voucher' => true,
                'checked_in_at' => $checkedIn ? $scheduledAt->copy()->addMinutes(2) : null,
                'completed_at' => $completed ? $scheduledAt->copy()->addMinutes($service->duration_minutes) : null,
            ]
        );

        $this->ledgerEntry($booking);

        return $booking;
    }

    private function ledgerEntry(Booking $booking): void
    {
        $gross = (float) $booking->total_amount;
        $commission = round($gross * 0.12, 2);
        $voucherContribution = round($gross * 0.03, 2);
        $partnerEarnings = round($gross - $commission - $voucherContribution, 2);

        Transaction::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'tenant_id' => $booking->tenant_id,
                'user_id' => $booking->user_id,
                'gross_amount' => $gross,
                'platform_commission' => $commission,
                'voucher_contribution' => $voucherContribution,
                'partner_earnings' => $partnerEarnings,
                'gateway' => 'payfast',
                'gateway_reference' => 'PF-'.strtoupper(Str::random(10)),
                'status' => 'completed',
            ]
        );
    }
}
