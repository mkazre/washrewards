<?php

namespace App\Services\Auth;

use App\Models\PlatformSetting;
use App\Models\User;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Verifies a token handed up by the mobile app's native sign-in flow
 * (Google/Apple id_tokens are JWTs signed by the provider; Facebook hands
 * over an opaque access token checked via the Graph API instead) and
 * resolves it to {email, name}. Nothing here trusts client-supplied
 * name/email without also verifying the token was genuinely issued by the
 * provider for *this* app — see the audience/app-id checks in each method.
 */
class SocialAuthService
{
    private const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    private const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

    /**
     * @return array{ok: bool, message: ?string, email: ?string, name: ?string}
     */
    public function verify(string $provider, string $token): array
    {
        $settings = PlatformSetting::current();

        return match ($provider) {
            'google' => $this->verifyGoogle($token, $settings),
            'apple' => $this->verifyApple($token, $settings),
            'facebook' => $this->verifyFacebook($token, $settings),
            default => ['ok' => false, 'message' => 'Unknown sign-in provider.', 'email' => null, 'name' => null],
        };
    }

    public static function providerEnabled(string $provider): bool
    {
        $settings = PlatformSetting::current();

        return match ($provider) {
            'google' => $settings->google_login_enabled && filled($settings->google_client_id),
            'apple' => $settings->apple_login_enabled && filled($settings->apple_client_id),
            'facebook' => $settings->facebook_login_enabled && filled($settings->facebook_app_id) && filled($settings->facebook_app_secret),
            default => false,
        };
    }

    private function verifyGoogle(string $idToken, PlatformSetting $settings): array
    {
        if (! self::providerEnabled('google')) {
            return ['ok' => false, 'message' => 'Google sign-in is not enabled.', 'email' => null, 'name' => null];
        }

        try {
            $keys = JWK::parseKeySet($this->fetchJwks(self::GOOGLE_JWKS_URL, 'google'));
            $payload = (array) JWT::decode($idToken, $keys);
        } catch (\Throwable) {
            return ['ok' => false, 'message' => 'Could not verify this Google sign-in.', 'email' => null, 'name' => null];
        }

        if (($payload['aud'] ?? null) !== $settings->google_client_id) {
            return ['ok' => false, 'message' => 'This sign-in was issued for a different app.', 'email' => null, 'name' => null];
        }

        if (! in_array($payload['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true)) {
            return ['ok' => false, 'message' => 'Could not verify this Google sign-in.', 'email' => null, 'name' => null];
        }

        if (empty($payload['email']) || empty($payload['email_verified'])) {
            return ['ok' => false, 'message' => 'Your Google account has no verified email.', 'email' => null, 'name' => null];
        }

        return ['ok' => true, 'message' => null, 'email' => $payload['email'], 'name' => $payload['name'] ?? null];
    }

    private function verifyApple(string $idToken, PlatformSetting $settings): array
    {
        if (! self::providerEnabled('apple')) {
            return ['ok' => false, 'message' => 'Apple sign-in is not enabled.', 'email' => null, 'name' => null];
        }

        try {
            $keys = JWK::parseKeySet($this->fetchJwks(self::APPLE_JWKS_URL, 'apple'));
            $payload = (array) JWT::decode($idToken, $keys);
        } catch (\Throwable) {
            return ['ok' => false, 'message' => 'Could not verify this Apple sign-in.', 'email' => null, 'name' => null];
        }

        if (($payload['aud'] ?? null) !== $settings->apple_client_id) {
            return ['ok' => false, 'message' => 'This sign-in was issued for a different app.', 'email' => null, 'name' => null];
        }

        if (($payload['iss'] ?? null) !== 'https://appleid.apple.com') {
            return ['ok' => false, 'message' => 'Could not verify this Apple sign-in.', 'email' => null, 'name' => null];
        }

        // Apple only sends an email on the *first* authorization for a given
        // user + app; the mobile client is responsible for caching the name
        // it receives that first time and re-sending it, since Apple's own
        // token never carries a name claim at all.
        if (empty($payload['email'])) {
            return ['ok' => false, 'message' => 'Could not read an email from this Apple sign-in.', 'email' => null, 'name' => null];
        }

        return ['ok' => true, 'message' => null, 'email' => $payload['email'], 'name' => null];
    }

    private function verifyFacebook(string $accessToken, PlatformSetting $settings): array
    {
        if (! self::providerEnabled('facebook')) {
            return ['ok' => false, 'message' => 'Facebook sign-in is not enabled.', 'email' => null, 'name' => null];
        }

        // Confirm the token was actually issued for *this* Facebook app
        // before trusting anything it says, using Facebook's debug_token
        // endpoint with an app-access-token — prevents a token minted for a
        // different app being replayed against our API.
        $debug = Http::get('https://graph.facebook.com/debug_token', [
            'input_token' => $accessToken,
            'access_token' => $settings->facebook_app_id.'|'.$settings->facebook_app_secret,
        ]);

        $debugData = $debug->json('data') ?? [];

        if (! $debug->ok() || ($debugData['app_id'] ?? null) != $settings->facebook_app_id || ! ($debugData['is_valid'] ?? false)) {
            return ['ok' => false, 'message' => 'Could not verify this Facebook sign-in.', 'email' => null, 'name' => null];
        }

        $profile = Http::get('https://graph.facebook.com/me', [
            'fields' => 'id,name,email',
            'access_token' => $accessToken,
        ]);

        if (! $profile->ok() || empty($profile->json('email'))) {
            return ['ok' => false, 'message' => 'Your Facebook account has no accessible email — grant email permission and try again.', 'email' => null, 'name' => null];
        }

        return ['ok' => true, 'message' => null, 'email' => $profile->json('email'), 'name' => $profile->json('name')];
    }

    /**
     * JWKS are cached for an hour — both Google and Apple rotate keys
     * infrequently and rate-limit this endpoint.
     */
    private function fetchJwks(string $url, string $provider): array
    {
        return Cache::remember("social_auth_jwks_{$provider}", now()->addHour(), function () use ($url) {
            $response = Http::get($url);

            if (! $response->ok()) {
                throw new RuntimeException("Could not fetch JWKS from {$url}");
            }

            return $response->json();
        });
    }

    public function findOrCreateUser(string $email, ?string $name): User
    {
        $email = strtolower($email);

        return User::firstOrCreate(
            ['email' => $email],
            ['name' => $name ?: 'WashRewards Customer', 'password' => Hash::make(str()->random(32))]
        );
    }
}
