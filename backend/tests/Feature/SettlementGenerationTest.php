<?php

namespace Tests\Feature;

use App\Models\Settlement;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettlementGenerationTest extends TestCase
{
    use RefreshDatabase;

    private function makeTransaction(Tenant $tenant, \Carbon\Carbon $when, float $gross = 100, float $commission = 15, float $voucherContribution = 3, float $partnerEarnings = 85): Transaction
    {
        $service = $tenant->services()->create(['name' => 'Wash', 'price' => $gross, 'duration_minutes' => 20]);
        $user = User::factory()->create();
        $vehicle = Vehicle::create(['user_id' => $user->id, 'make' => 'VW', 'model' => 'Polo', 'plate' => uniqid()]);
        $booking = $tenant->bookings()->create([
            'user_id' => $user->id, 'vehicle_id' => $vehicle->id, 'service_id' => $service->id,
            'status' => 'completed', 'scheduled_at' => $when,
            'price' => $gross, 'travel_fee' => 0, 'total_amount' => $gross,
            'payment_status' => 'paid',
        ]);

        $transaction = Transaction::create([
            'tenant_id' => $tenant->id, 'booking_id' => $booking->id, 'user_id' => $user->id,
            'gross_amount' => $gross, 'platform_commission' => $commission,
            'voucher_contribution' => $voucherContribution, 'partner_earnings' => $partnerEarnings,
            'gateway' => 'sandbox', 'gateway_reference' => 'TEST-'.uniqid(), 'status' => 'completed',
        ]);
        $transaction->forceFill(['created_at' => $when, 'updated_at' => $when])->save();

        return $transaction;
    }

    public function test_generates_one_settlement_per_tenant_aggregating_the_days_transactions(): void
    {
        $tenant = Tenant::create(['name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active']);
        $yesterday = now()->subDay();

        $this->makeTransaction($tenant, $yesterday->copy()->setTime(9, 0), gross: 100, commission: 15, voucherContribution: 3, partnerEarnings: 85);
        $this->makeTransaction($tenant, $yesterday->copy()->setTime(14, 0), gross: 200, commission: 30, voucherContribution: 6, partnerEarnings: 170);
        // Not yesterday — should be excluded from this batch.
        $this->makeTransaction($tenant, now(), gross: 999);

        $this->artisan('settlements:generate', ['--date' => $yesterday->toDateString()])
            ->expectsOutputToContain('Generated 1 settlement(s)')
            ->assertSuccessful();

        $settlement = Settlement::where('tenant_id', $tenant->id)->first();
        $this->assertNotNull($settlement);
        $this->assertSame(300.0, (float) $settlement->gross_amount);
        $this->assertSame(45.0, (float) $settlement->commission_amount);
        $this->assertSame(255.0, (float) $settlement->net_payout);
        $this->assertSame('pending', $settlement->status);

        $this->assertSame(2, Transaction::where('settlement_id', $settlement->id)->count());

        // Today's transaction was untouched.
        $this->assertSame(1, Transaction::whereNull('settlement_id')->count());
    }

    public function test_is_idempotent_and_does_not_double_settle(): void
    {
        $tenant = Tenant::create(['name' => 'Test Wash', 'slug' => 'test-wash', 'type' => 'fixed_garage', 'status' => 'active']);
        $yesterday = now()->subDay();
        $this->makeTransaction($tenant, $yesterday);

        $this->artisan('settlements:generate', ['--date' => $yesterday->toDateString()])->assertSuccessful();
        $this->assertSame(1, Settlement::count());

        $this->artisan('settlements:generate', ['--date' => $yesterday->toDateString()])
            ->expectsOutputToContain('Generated 0 settlement(s)')
            ->assertSuccessful();
        $this->assertSame(1, Settlement::count());
    }
}
