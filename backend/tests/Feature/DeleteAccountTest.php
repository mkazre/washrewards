<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_an_account_anonymises_it_and_revokes_all_tokens(): void
    {
        $user = User::factory()->create(['phone' => '+27825550142']);
        $token = $user->createToken('mobile')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson('/api/auth/me')
            ->assertOk();

        $user->refresh();
        $this->assertSame('Deleted user', $user->name);
        $this->assertNull($user->phone);
        $this->assertStringContainsString('@deleted.washrewards.co.za', $user->email);
        $this->assertFalse((bool) $user->is_admin);
        // Sanctum resolves a token by looking up its row on every request, so
        // deleting the row (asserted below) is what actually revokes it —
        // this is Sanctum's own well-tested mechanism, not app-specific
        // logic, hence no need to also exercise a second live request here.
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_deleting_an_account_frees_the_phone_number_for_reuse(): void
    {
        $user = User::factory()->create(['phone' => '+27825550142']);
        $token = $user->createToken('mobile')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson('/api/auth/me')->assertOk();

        $newUser = User::create([
            'name' => 'New Person',
            'email' => 'new@example.com',
            'phone' => '+27825550142',
            'password' => bcrypt('secret'),
        ]);

        $this->assertNotNull($newUser->id);
    }

    public function test_deleting_an_account_removes_partner_access_but_keeps_booking_history(): void
    {
        $tenant = Tenant::create(['name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active']);
        $user = User::factory()->create();
        $tenant->users()->attach($user, ['role' => 'owner']);

        $vehicle = Vehicle::create(['user_id' => $user->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'ABC123']);
        $service = $tenant->services()->create(['name' => 'Wash', 'price' => 100, 'duration_minutes' => 20]);
        $booking = $tenant->bookings()->create([
            'user_id' => $user->id,
            'vehicle_id' => $vehicle->id,
            'service_id' => $service->id,
            'status' => 'completed',
            'scheduled_at' => now()->subDay(),
            'price' => 100,
            'travel_fee' => 0,
            'total_amount' => 100,
            'payment_status' => 'paid',
            'payment_method' => 'card',
        ]);

        $token = $user->createToken('mobile')->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$token}")->deleteJson('/api/auth/me')->assertOk();

        $this->assertSame(0, $user->tenants()->count());
        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'user_id' => $user->id]);
    }
}
