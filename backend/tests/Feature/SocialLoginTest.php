<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SocialLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_unknown_provider_returns_not_found(): void
    {
        $this->postJson('/api/auth/social/tiktok', ['token' => 'whatever'])
            ->assertNotFound();
    }

    public function test_a_disabled_provider_is_rejected_even_with_a_token(): void
    {
        PlatformSetting::create(['google_login_enabled' => false]);

        $this->postJson('/api/auth/social/google', ['token' => 'whatever'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Google sign-in is not enabled.');
    }

    public function test_an_enabled_provider_without_a_valid_token_is_rejected(): void
    {
        PlatformSetting::create([
            'google_login_enabled' => true,
            'google_client_id' => 'test-client-id.apps.googleusercontent.com',
        ]);

        // Fakes Google's JWKS lookup so this test never hits the network —
        // the malformed token below fails signature verification regardless
        // of what keys are returned.
        Http::fake(['www.googleapis.com/*' => Http::response(['keys' => []])]);

        $this->postJson('/api/auth/social/google', ['token' => 'not-a-real-jwt'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Could not verify this Google sign-in.');
    }
}
