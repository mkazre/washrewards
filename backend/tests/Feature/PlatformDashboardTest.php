<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformDashboardTest extends TestCase
{
    use RefreshDatabase;

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
    }

    public function test_a_regular_customer_cannot_access_the_platform_console(): void
    {
        $customer = User::factory()->create(['is_admin' => false]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/platform/dashboard')
            ->assertForbidden();
    }

    public function test_a_platform_admin_can_view_network_wide_aggregates(): void
    {
        Tenant::create(['name' => 'Wash A', 'slug' => 'wash-a', 'type' => 'fixed_garage', 'status' => 'active']);
        Tenant::create(['name' => 'Wash B', 'slug' => 'wash-b', 'type' => 'fixed_garage', 'status' => 'active']);
        Tenant::create(['name' => 'Wash C (suspended)', 'slug' => 'wash-c', 'type' => 'fixed_garage', 'status' => 'suspended']);

        $admin = User::factory()->create(['is_admin' => true]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/platform/dashboard');

        $response->assertOk();
        $response->assertJsonPath('active_partners', 2);
        $response->assertJsonStructure([
            'commission_this_month', 'gross_bookings_this_month', 'bookings_per_month',
            'active_partners', 'avg_commission_per_partner', 'default_commission_rate',
        ]);
    }
}
