<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoucherQrRedemptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_partner_can_redeem_a_customers_voucher_by_scanning_its_qr_token(): void
    {
        $tenant = Tenant::create(['name' => 'Wash A', 'slug' => 'wash-a', 'type' => 'fixed_garage', 'status' => 'active']);
        $owner = User::factory()->create();
        $tenant->users()->attach($owner, ['role' => 'owner']);

        $customer = User::factory()->create();
        $voucher = Voucher::create([
            'user_id' => $customer->id, 'code' => 'WR-ABCDEF', 'amount' => 100,
            'status' => 'active', 'source' => 'loyalty', 'earned_at' => now(),
        ]);
        $this->assertNotNull($voucher->qr_token, 'A qr_token should be generated automatically on create.');

        $response = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/partner/vouchers/redeem', ['qr_token' => $voucher->qr_token]);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'redeemed');

        $this->assertSame('redeemed', $voucher->fresh()->status);
    }

    public function test_an_already_redeemed_voucher_cannot_be_redeemed_again(): void
    {
        $tenant = Tenant::create(['name' => 'Wash A', 'slug' => 'wash-a', 'type' => 'fixed_garage', 'status' => 'active']);
        $owner = User::factory()->create();
        $tenant->users()->attach($owner, ['role' => 'owner']);

        $customer = User::factory()->create();
        $voucher = Voucher::create([
            'user_id' => $customer->id, 'code' => 'WR-ABCDEF', 'amount' => 100,
            'status' => 'redeemed', 'source' => 'loyalty', 'earned_at' => now(), 'redeemed_at' => now(),
        ]);

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/partner/vouchers/redeem', ['qr_token' => $voucher->qr_token])
            ->assertStatus(422);
    }

    public function test_an_unrecognised_qr_token_returns_not_found(): void
    {
        $tenant = Tenant::create(['name' => 'Wash A', 'slug' => 'wash-a', 'type' => 'fixed_garage', 'status' => 'active']);
        $owner = User::factory()->create();
        $tenant->users()->attach($owner, ['role' => 'owner']);

        $this->actingAs($owner, 'sanctum')
            ->postJson('/api/partner/vouchers/redeem', ['qr_token' => 'does-not-exist'])
            ->assertStatus(404);
    }
}
