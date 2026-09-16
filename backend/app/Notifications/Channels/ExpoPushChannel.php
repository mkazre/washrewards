<?php

namespace App\Notifications\Channels;

use App\Services\Notifications\PushNotificationService;
use Illuminate\Notifications\Notification;

class ExpoPushChannel
{
    public function __construct(private readonly PushNotificationService $push) {}

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toExpoPush')) {
            return;
        }

        $tokens = $notifiable->deviceTokens()->pluck('expo_push_token');

        if ($tokens->isEmpty()) {
            return;
        }

        $payload = $notification->toExpoPush($notifiable);

        $this->push->send($tokens, $payload['title'], $payload['body'], $payload['data'] ?? []);
    }
}
