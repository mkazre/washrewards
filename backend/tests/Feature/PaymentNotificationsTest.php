<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use App\Notifications\AppNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PaymentNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_paying_a_booking_notifies_the_customer_and_the_partner(): void
    {
        Notification::fake();

        PlatformSetting::create([
            'default_commission_rate' => 15.00,
            'voucher_contribution_rate' => 20.00,
            'voucher_wash_threshold' => 5,
            'voucher_amount' => 100.00,
            'voucher_expiry_days' => 90,
        ]);

        $tenant = Tenant::create(['name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active']);
        $partnerUser = User::factory()->create();
        $tenant->users()->attach($partnerUser, ['role' => 'owner']);

        $customer = User::factory()->create();
        $vehicle = Vehicle::create(['user_id' => $customer->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'ABC123']);
        $service = $tenant->services()->create(['name' => 'Wash', 'price' => 100, 'duration_minutes' => 20]);
        $booking = $tenant->bookings()->create([
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

        $this->actingAs($customer, 'sanctum')->postJson("/api/bookings/{$booking->id}/pay")->assertOk();

        Notification::assertSentTo($customer, AppNotification::class, function (AppNotification $notification) use ($customer) {
            return $notification->toArray($customer)['title'] === 'Payment successful';
        });
        Notification::assertSentTo($partnerUser, AppNotification::class, function (AppNotification $notification) use ($partnerUser) {
            return $notification->toArray($partnerUser)['title'] === 'New booking';
        });
    }

    public function test_completing_a_booking_notifies_the_customer(): void
    {
        Notification::fake();

        $tenant = Tenant::create(['name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active']);
        $partnerUser = User::factory()->create();
        $tenant->users()->attach($partnerUser, ['role' => 'owner']);

        $customer = User::factory()->create();
        $vehicle = Vehicle::create(['user_id' => $customer->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'ABC123']);
        $service = $tenant->services()->create(['name' => 'Wash', 'price' => 100, 'duration_minutes' => 20]);
        $booking = $tenant->bookings()->create([
            'user_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'service_id' => $service->id,
            'status' => 'checked_in',
            'scheduled_at' => now()->addDay(),
            'price' => 100,
            'travel_fee' => 0,
            'total_amount' => 100,
            'payment_status' => 'paid',
            'payment_method' => 'card',
        ]);

        $this->actingAs($partnerUser, 'sanctum')->postJson("/api/partner/bookings/{$booking->id}/advance")->assertOk();

        Notification::assertSentTo($customer, AppNotification::class, function (AppNotification $notification) use ($customer) {
            return $notification->toArray($customer)['title'] === 'Wash complete';
        });
    }
}
