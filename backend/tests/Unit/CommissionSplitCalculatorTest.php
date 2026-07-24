<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\PlatformSetting;
use App\Models\Service;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\Payments\CommissionSplitCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommissionSplitCalculatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_commission_is_charged_on_price_only_not_travel_fee(): void
    {
        PlatformSetting::create([
            'default_commission_rate' => 15.00,
            'voucher_contribution_rate' => 20.00,
            'voucher_wash_threshold' => 5,
            'voucher_amount' => 100.00,
            'voucher_expiry_days' => 90,
        ]);

        $tenant = Tenant::create([
            'name' => 'Mobile Wash Co', 'slug' => 'mobile-wash-co', 'type' => 'mobile_wash',
            'status' => 'active', 'travel_fee' => 35.00,
        ]);
        $service = $tenant->services()->create(['name' => 'Basic Wash', 'price' => 100, 'duration_minutes' => 20]);
        $user = User::factory()->create();
        $vehicle = Vehicle::create(['user_id' => $user->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'XYZ']);

        $booking = $tenant->bookings()->create([
            'user_id' => $user->id, 'vehicle_id' => $vehicle->id, 'service_id' => $service->id,
            'status' => 'confirmed', 'scheduled_at' => now()->addDay(),
            'price' => 100, 'travel_fee' => 35, 'total_amount' => 135,
        ]);

        $split = (new CommissionSplitCalculator)->calculate($booking);

        // Commission: 15% of the R100 price only, not the R35 travel fee.
        $this->assertSame(15.0, $split->platformCommission);
        // Voucher pool: 20% of that R15 commission.
        $this->assertSame(3.0, $split->voucherContribution);
        // Partner keeps the travel fee in full: (135 - 15) = 120.
        $this->assertSame(120.0, $split->partnerEarnings);
        $this->assertSame(135.0, $split->grossAmount);
    }

    public function test_tenant_specific_commission_rate_overrides_platform_default(): void
    {
        PlatformSetting::create([
            'default_commission_rate' => 15.00,
            'voucher_contribution_rate' => 20.00,
            'voucher_wash_threshold' => 5,
            'voucher_amount' => 100.00,
            'voucher_expiry_days' => 90,
        ]);

        $tenant = Tenant::create([
            'name' => 'VIP Garage', 'slug' => 'vip-garage', 'type' => 'fixed_garage',
            'status' => 'active', 'commission_rate' => 10.00,
        ]);
        $service = $tenant->services()->create(['name' => 'Wash', 'price' => 200, 'duration_minutes' => 20]);
        $user = User::factory()->create();
        $vehicle = Vehicle::create(['user_id' => $user->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => 'XYZ']);

        $booking = $tenant->bookings()->create([
            'user_id' => $user->id, 'vehicle_id' => $vehicle->id, 'service_id' => $service->id,
            'status' => 'confirmed', 'scheduled_at' => now()->addDay(),
            'price' => 200, 'travel_fee' => 0, 'total_amount' => 200,
        ]);

        $split = (new CommissionSplitCalculator)->calculate($booking);

        // 10% tenant override, not the 15% platform default.
        $this->assertSame(20.0, $split->platformCommission);
    }
}
