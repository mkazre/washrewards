<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Promotion;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression coverage for a real bug: {booking}/{service}/{promotion} route
 * params on partner routes resolve via Laravel's built-in `api` middleware
 * group's SubstituteBindings, which runs BEFORE our custom `tenant`
 * middleware sets TenantContext — so the BelongsToTenant global scope isn't
 * active yet at binding time, and a partner could view/mutate another
 * tenant's records by guessing IDs. Fixed via explicit ownership checks in
 * AuthorizesTenantOwnership; these tests must keep passing.
 */
class PartnerTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;

    private Tenant $tenantB;

    private User $ownerA;

    private Booking $bookingB;

    private Service $serviceB;

    private Promotion $promotionB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = Tenant::create([
            'name' => 'Tenant A', 'slug' => 'tenant-a', 'type' => 'fixed_garage', 'status' => 'active',
        ]);
        $this->tenantB = Tenant::create([
            'name' => 'Tenant B', 'slug' => 'tenant-b', 'type' => 'fixed_garage', 'status' => 'active',
        ]);

        $this->ownerA = User::factory()->create();
        $this->tenantA->users()->attach($this->ownerA, ['role' => 'owner']);

        $ownerB = User::factory()->create();
        $this->tenantB->users()->attach($ownerB, ['role' => 'owner']);

        $this->serviceB = $this->tenantB->services()->create([
            'name' => 'Basic Wash', 'price' => 50, 'duration_minutes' => 20,
        ]);

        $customer = User::factory()->create();
        $vehicle = Vehicle::create(['user_id' => $customer->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'ABC123']);

        $this->bookingB = $this->tenantB->bookings()->create([
            'user_id' => $customer->id,
            'vehicle_id' => $vehicle->id,
            'service_id' => $this->serviceB->id,
            'status' => 'confirmed',
            'scheduled_at' => now()->addDay(),
            'price' => 50,
            'total_amount' => 50,
        ]);

        $this->promotionB = $this->tenantB->promotions()->create([
            'title' => 'Tenant B promo', 'discount_type' => 'percent', 'discount_value' => 10,
            'starts_at' => now(), 'ends_at' => now()->addWeek(),
        ]);
    }

    public function test_partner_cannot_view_another_tenants_booking(): void
    {
        $this->actingAs($this->ownerA, 'sanctum')
            ->getJson("/api/partner/bookings/{$this->bookingB->id}")
            ->assertNotFound();
    }

    public function test_partner_cannot_advance_another_tenants_booking(): void
    {
        $this->actingAs($this->ownerA, 'sanctum')
            ->postJson("/api/partner/bookings/{$this->bookingB->id}/advance")
            ->assertNotFound();

        $this->assertSame('confirmed', $this->bookingB->fresh()->status);
    }

    public function test_partner_cannot_view_or_edit_another_tenants_service(): void
    {
        $this->actingAs($this->ownerA, 'sanctum')
            ->getJson("/api/partner/services/{$this->serviceB->id}")
            ->assertNotFound();

        $this->actingAs($this->ownerA, 'sanctum')
            ->putJson("/api/partner/services/{$this->serviceB->id}", ['name' => 'Hijacked'])
            ->assertNotFound();

        $this->assertSame('Basic Wash', $this->serviceB->fresh()->name);
    }

    public function test_partner_cannot_delete_another_tenants_service(): void
    {
        $this->actingAs($this->ownerA, 'sanctum')
            ->deleteJson("/api/partner/services/{$this->serviceB->id}")
            ->assertNotFound();

        $this->assertNotNull($this->serviceB->fresh());
    }

    public function test_partner_cannot_view_or_edit_another_tenants_promotion(): void
    {
        $this->actingAs($this->ownerA, 'sanctum')
            ->getJson("/api/partner/promotions/{$this->promotionB->id}")
            ->assertNotFound();

        $this->actingAs($this->ownerA, 'sanctum')
            ->putJson("/api/partner/promotions/{$this->promotionB->id}", ['title' => 'Hijacked'])
            ->assertNotFound();

        $this->assertSame('Tenant B promo', $this->promotionB->fresh()->title);
    }

    public function test_partner_can_access_their_own_tenants_booking(): void
    {
        $ownBooking = $this->tenantA->bookings()->create([
            'user_id' => $this->bookingB->user_id,
            'vehicle_id' => $this->bookingB->vehicle_id,
            'service_id' => $this->tenantA->services()->create([
                'name' => 'Basic Wash', 'price' => 40, 'duration_minutes' => 20,
            ])->id,
            'status' => 'confirmed',
            'scheduled_at' => now()->addDay(),
            'price' => 40,
            'total_amount' => 40,
        ]);

        $this->actingAs($this->ownerA, 'sanctum')
            ->getJson("/api/partner/bookings/{$ownBooking->id}")
            ->assertOk();
    }
}
