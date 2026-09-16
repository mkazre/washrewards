<?php

namespace Tests\Feature;

use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PushTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_register_a_push_token(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/push-tokens', ['expo_push_token' => 'ExponentPushToken[abc123]', 'platform' => 'android'])
            ->assertOk();

        $this->assertDatabaseHas('device_tokens', [
            'user_id' => $user->id,
            'expo_push_token' => 'ExponentPushToken[abc123]',
            'platform' => 'android',
        ]);
    }

    public function test_registering_the_same_token_twice_does_not_duplicate_it(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson('/api/push-tokens', ['expo_push_token' => 'tok-1'])->assertOk();
        $this->actingAs($user, 'sanctum')->postJson('/api/push-tokens', ['expo_push_token' => 'tok-1'])->assertOk();

        $this->assertSame(1, DeviceToken::where('expo_push_token', 'tok-1')->count());
    }

    public function test_a_token_re_registered_by_a_different_user_is_reassigned(): void
    {
        $first = User::factory()->create();
        $second = User::factory()->create();

        $this->actingAs($first, 'sanctum')->postJson('/api/push-tokens', ['expo_push_token' => 'shared-device'])->assertOk();
        $this->actingAs($second, 'sanctum')->postJson('/api/push-tokens', ['expo_push_token' => 'shared-device'])->assertOk();

        $this->assertSame(1, DeviceToken::where('expo_push_token', 'shared-device')->count());
        $this->assertSame($second->id, DeviceToken::where('expo_push_token', 'shared-device')->first()->user_id);
    }

    public function test_a_user_can_unregister_a_push_token(): void
    {
        $user = User::factory()->create();
        DeviceToken::create(['user_id' => $user->id, 'expo_push_token' => 'tok-2']);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/push-tokens', ['expo_push_token' => 'tok-2'])
            ->assertOk();

        $this->assertDatabaseMissing('device_tokens', ['expo_push_token' => 'tok-2']);
    }
}
