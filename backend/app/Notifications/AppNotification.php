<?php

namespace App\Notifications;

use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * One reusable notification for every in-app event (booking confirmed,
 * voucher earned, wash status updates, new booking for a partner, etc.) —
 * fires both a database row (the app's Notifications screen) and an Expo
 * push (the phone's lock-screen alert) from a single title/body/data set,
 * rather than a bespoke Notification class per event type.
 */
class AppNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $title,
        private readonly string $body,
        private readonly array $data = [],
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', ExpoPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            ...$this->data,
        ];
    }

    public function toExpoPush(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'data' => $this->data,
        ];
    }
}
