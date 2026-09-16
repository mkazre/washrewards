<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use App\Payments\Drivers\OzowGateway;
use App\Payments\Drivers\PayFastGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Locks in that gateway redirects always point back into the mobile app
 * (washrewards://) — they previously pointed at /payments/{gateway}/return
 * web routes that never existed, so a real checkout would strand the
 * customer in the browser with no way back into the app.
 */
class PaymentReturnUrlTest extends TestCase
{
    use RefreshDatabase;

    private Booking $booking;

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = Tenant::create(['name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active']);
        $customer = User::factory()->create();
        $vehicle = Vehicle::create(['user_id' => $customer->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'ABC123']);
        $service = $tenant->services()->create(['name' => 'Wash', 'price' => 100, 'duration_minutes' => 20]);

        $this->booking = $tenant->bookings()->create([
            'user_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'service_id' => $service->id,
            'status' => 'pending',
            'scheduled_at' => now()->addDay(),
            'price' => 100,
            'travel_fee' => 0,
            'total_amount' => 100,
            'payment_status' => 'pending',
            'payment_method' => 'card',
        ]);
    }

    public function test_payfast_redirect_returns_to_the_app_not_a_dead_web_route(): void
    {
        PlatformSetting::create(['payfast_merchant_id' => 'x', 'payfast_merchant_key' => 'y']);

        $result = (new PayFastGateway)->charge($this->booking);

        $this->assertStringContainsString(
            'return_url=washrewards%3A%2F%2Fpayment-return%3Fbooking_id%3D'.$this->booking->id,
            $result->redirectUrl
        );
        $this->assertStringNotContainsString('/payments/payfast/return', $result->redirectUrl);
    }

    public function test_ozow_redirect_returns_to_the_app_not_a_dead_web_route(): void
    {
        PlatformSetting::create(['ozow_site_code' => 'x', 'ozow_api_key' => 'y', 'ozow_private_key' => 'z']);

        $result = (new OzowGateway)->charge($this->booking);

        $this->assertStringContainsString(
            'SuccessUrl=washrewards%3A%2F%2Fpayment-return%3Fbooking_id%3D'.$this->booking->id,
            $result->redirectUrl
        );
        $this->assertStringNotContainsString('/payments/ozow/return', $result->redirectUrl);
    }
}
