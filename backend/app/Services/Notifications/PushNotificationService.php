<?php

namespace App\Services\Notifications;

use App\Models\PlatformSetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends messages through Expo's push notification service
 * (https://exp.host/--/api/v2/push/send), which fans out to real APNs/FCM
 * delivery on Expo's side — no direct Apple/Google push credentials needed
 * here, only whatever FCM/APNs credentials were uploaded to the EAS project
 * itself (a one-time `eas credentials` setup, unrelated to this service).
 */
class PushNotificationService
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    private const CHUNK_SIZE = 100;

    /**
     * @param  Collection<int,string>|array<int,string>  $tokens
     */
    public function send(iterable $tokens, string $title, string $body, array $data = []): void
    {
        $tokens = collect($tokens)->filter()->unique()->values();

        if ($tokens->isEmpty()) {
            return;
        }

        $accessToken = PlatformSetting::current()->expo_access_token;

        foreach ($tokens->chunk(self::CHUNK_SIZE) as $chunk) {
            $messages = $chunk->map(fn (string $token) => [
                'to' => $token,
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'sound' => 'default',
                'priority' => 'high',
                'channelId' => 'default',
            ])->values()->all();

            try {
                Http::withHeaders(array_filter([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'Authorization' => $accessToken ? "Bearer {$accessToken}" : null,
                ]))->post(self::ENDPOINT, $messages);
            } catch (\Throwable $e) {
                // Push delivery is best-effort — the in-app notification (via
                // the database channel) is the durable record either way, so
                // a transient failure here never blocks the triggering action.
                Log::warning('Expo push send failed', ['error' => $e->getMessage()]);
            }
        }
    }
}
