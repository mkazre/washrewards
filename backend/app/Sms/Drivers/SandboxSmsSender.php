<?php

namespace App\Sms\Drivers;

use App\Sms\Contracts\SmsSender;
use Illuminate\Support\Facades\Log;

/**
 * Stand-in SMS sender for local dev/testing until AWS SNS is configured
 * (see App\Sms\Drivers\SnsSmsSender). Never actually sends anything — just
 * logs the message so the OTP code is visible to a developer/tester without
 * a real phone number, the same role SandboxGateway plays for payments.
 */
class SandboxSmsSender implements SmsSender
{
    public function send(string $phone, string $message): void
    {
        Log::info("[sandbox-sms] to {$phone}: {$message}");
    }
}
