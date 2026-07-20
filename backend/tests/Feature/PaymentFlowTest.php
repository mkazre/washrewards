<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private Tenant $tenant;

    private Vehicle $vehicle;

    protected function setUp(): void
    {
        parent::setUp();

        PlatformSetting::create([
            'default_commission_rate' => 15.00,
            'voucher_contribution_rate' => 20.00,
            'voucher_wash_threshold' => 5,
            'voucher_amount' => 100.00,
            'voucher_expiry_days' => 90,
        ]);

        $this->tenant = Tenant::create([
            'name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active',
        ]);
        $this->customer = User::factory()->create();
        $this->vehicle = Vehicle::create([
            'user_id' => $this->customer->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'ABC123',
        ]);
    }

    private function makePendingBooking(): Booking
    {
        $service = $this->tenant->services()->create(['name' => 'Wash', 'price' => 100, 'duration_minutes' => 20]);

        return $this->tenant->bookings()->create([
            'user_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
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

    public function test_paying_a_booking_confirms_it_and_creates_a_ledger_entry(): void
    {
        $booking = $this->makePendingBooking();

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/bookings/{$booking->id}/pay");

        $response->assertOk();
        $response->assertJsonPath('booking.status', 'confirmed');
        $response->assertJsonPath('booking.payment_status', 'paid');

        $booking->refresh();
        $this->assertSame('confirmed', $booking->status);
        $this->assertSame('paid', $booking->payment_status);
        $this->assertTrue($booking->counts_toward_voucher);

        $transaction = Transaction::where('booking_id', $booking->id)->first();
        $this->assertNotNull($transaction);
        $this->assertSame('sandbox', $transaction->gateway);
        $this->assertSame('completed', $transaction->status);
        $this->assertSame(15.0, (float) $transaction->platform_commission);
    }

    public function test_cannot_pay_an_already_paid_booking(): void
    {
        $booking = $this->makePendingBooking();

        $this->actingAs($this->customer, 'sanctum')->postJson("/api/bookings/{$booking->id}/pay")->assertOk();
        $this->actingAs($this->customer, 'sanctum')->postJson("/api/bookings/{$booking->id}/pay")->assertStatus(422);

        $this->assertSame(1, Transaction::where('booking_id', $booking->id)->count());
    }

    public function test_another_customer_cannot_pay_someone_elses_booking(): void
    {
        $booking = $this->makePendingBooking();
        $stranger = User::factory()->create();

        $this->actingAs($stranger, 'sanctum')
            ->postJson("/api/bookings/{$booking->id}/pay")
            ->assertForbidden();
    }

    public function test_fifth_paid_wash_automatically_earns_a_voucher(): void
    {
        for ($i = 0; $i < 4; $i++) {
            $booking = $this->makePendingBooking();
            $this->actingAs($this->customer, 'sanctum')->postJson("/api/bookings/{$booking->id}/pay")->assertOk();
        }

        $this->assertSame(0, Voucher::where('user_id', $this->customer->id)->count());

        $fifthBooking = $this->makePendingBooking();
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/bookings/{$fifthBooking->id}/pay");

        $response->assertOk();
        $response->assertJsonPath('voucher_earned.amount', 100);

        $voucher = Voucher::where('user_id', $this->customer->id)->first();
        $this->assertNotNull($voucher);
        $this->assertSame('active', $voucher->status);
        $this->assertSame('loyalty', $voucher->source);
    }
}
