<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConfigEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_config_hides_every_provider_and_maps_by_default(): void
    {
        $response = $this->getJson('/api/config');

        $response->assertOk();
        $response->assertJsonPath('social_login.google', null);
        $response->assertJsonPath('social_login.apple', null);
        $response->assertJsonPath('social_login.facebook', null);
        $response->assertJsonPath('maps', null);
    }

    public function test_config_exposes_google_client_id_once_enabled(): void
    {
        PlatformSetting::create([
            'google_login_enabled' => true,
            'google_client_id' => 'abc.apps.googleusercontent.com',
        ]);

        $this->getJson('/api/config')
            ->assertJsonPath('social_login.google.client_id', 'abc.apps.googleusercontent.com');
    }

    public function test_config_never_leaks_facebook_app_secret(): void
    {
        PlatformSetting::create([
            'facebook_login_enabled' => true,
            'facebook_app_id' => '12345',
            'facebook_app_secret' => 'super-secret',
        ]);

        $response = $this->getJson('/api/config');

        $response->assertJsonPath('social_login.facebook.app_id', '12345');
        $response->assertJsonMissingPath('social_login.facebook.app_secret');
        $this->assertStringNotContainsString('super-secret', $response->getContent());
    }

    public function test_maps_stays_off_when_enabled_but_missing_credentials(): void
    {
        PlatformSetting::create(['maps_enabled' => true]);

        $this->getJson('/api/config')->assertJsonPath('maps', null);
    }

    public function test_maps_config_appears_once_fully_configured(): void
    {
        PlatformSetting::create([
            'maps_enabled' => true,
            'aws_location_map_name' => 'washrewards-map',
            'aws_location_region' => 'eu-west-1',
            'aws_location_api_key' => 'v1.public.abc',
        ]);

        $this->getJson('/api/config')
            ->assertJsonPath('maps.map_name', 'washrewards-map')
            ->assertJsonPath('maps.region', 'eu-west-1');
    }
}
