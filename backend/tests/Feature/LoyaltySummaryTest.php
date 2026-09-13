<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Voucher;
use Database\Seeders\LoyaltyTiersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoyaltySummaryTest extends TestCase
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

        $this->seed(LoyaltyTiersSeeder::class);
    }

    public function test_a_new_customer_starts_at_the_first_tier(): void
    {
        $customer = User::factory()->create();

        $response = $this->actingAs($customer, 'sanctum')->getJson('/api/loyalty/summary');

        $response->assertOk();
        $response->assertJsonPath('tier.name', 'Bronze');
        $response->assertJsonPath('month_washes', 0);
        $response->assertJsonCount(5, 'level_rows');
    }

    public function test_tier_rises_with_rolling_90_day_paid_washes(): void
    {
        $customer = User::factory()->create();
        $tenant = Tenant::create(['name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active']);
        $vehicle = Vehicle::create(['user_id' => $customer->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'ABC123']);
        $service = $tenant->services()->create(['name' => 'Wash', 'price' => 100, 'duration_minutes' => 20]);

        // 6 paid washes -> Gold (see LoyaltyTiersSeeder).
        for ($i = 0; $i < 6; $i++) {
            $tenant->bookings()->create([
                'user_id' => $customer->id, 'vehicle_id' => $vehicle->id, 'service_id' => $service->id,
                'status' => 'completed', 'scheduled_at' => now(), 'price' => 100, 'travel_fee' => 0,
                'total_amount' => 100, 'payment_status' => 'paid', 'payment_method' => 'card',
                'counts_toward_voucher' => true,
            ]);
        }

        $response = $this->actingAs($customer, 'sanctum')->getJson('/api/loyalty/summary');

        $response->assertOk();
        $response->assertJsonPath('tier.name', 'Gold');
        $response->assertJsonPath('month_washes', 6);
    }

    public function test_wallet_lists_only_active_vouchers(): void
    {
        $customer = User::factory()->create();
        Voucher::create([
            'user_id' => $customer->id, 'code' => 'WR-ACTIVE1', 'amount' => 100,
            'status' => 'active', 'source' => 'loyalty', 'earned_at' => now(),
        ]);
        Voucher::create([
            'user_id' => $customer->id, 'code' => 'WR-REDEEMED1', 'amount' => 100,
            'status' => 'redeemed', 'source' => 'loyalty', 'earned_at' => now(), 'redeemed_at' => now(),
        ]);

        $response = $this->actingAs($customer, 'sanctum')->getJson('/api/loyalty/summary');

        $response->assertOk();
        $response->assertJsonCount(1, 'wallet');
        $response->assertJsonPath('wallet.0.code', 'WR-ACTIVE1');
        $response->assertJsonPath('wallet_total', 100);
    }
}
