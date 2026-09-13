<?php

namespace Tests\Unit;

use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Voucher;
use App\Services\Loyalty\LoyaltyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoyaltyServiceIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_same_booking_cannot_earn_a_voucher_twice(): void
    {
        PlatformSetting::create([
            'default_commission_rate' => 15.00,
            'voucher_contribution_rate' => 20.00,
            'voucher_wash_threshold' => 1,
            'voucher_amount' => 100.00,
            'voucher_expiry_days' => 90,
        ]);

        $customer = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active']);
        $vehicle = Vehicle::create(['user_id' => $customer->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'ABC123']);
        $service = $tenant->services()->create(['name' => 'Wash', 'price' => 100, 'duration_minutes' => 20]);
        $booking = $tenant->bookings()->create([
            'user_id' => $customer->id, 'vehicle_id' => $vehicle->id, 'service_id' => $service->id,
            'status' => 'completed', 'scheduled_at' => now(), 'price' => 100, 'travel_fee' => 0,
            'total_amount' => 100, 'payment_status' => 'paid', 'payment_method' => 'card',
            'counts_toward_voucher' => true,
        ]);

        $loyalty = app(LoyaltyService::class);

        $first = $loyalty->checkAndIssueVoucher($customer, $booking);
        $second = $loyalty->checkAndIssueVoucher($customer, $booking);

        $this->assertNotNull($first);
        $this->assertNull($second, 'A retried call for the same booking must not issue a second voucher.');
        $this->assertSame(1, Voucher::where('user_id', $customer->id)->count());
    }
}
