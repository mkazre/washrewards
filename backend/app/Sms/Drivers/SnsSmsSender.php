<?php

namespace App\Sms\Drivers;

use Aws\Sns\SnsClient;
use App\Sms\Contracts\SmsSender;

/**
 * Real AWS SNS SMS delivery. Uses the same AWS credentials already
 * configured for S3 (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY /
 * AWS_DEFAULT_REGION in .env) — no separate SNS-specific env vars needed,
 * since those are infra-level credentials, not business config. Only
 * selected at runtime once PlatformSetting::sms_driver = 'sns' (see the
 * admin Settings page's "Integrations" section).
 */
class SnsSmsSender implements SmsSender
{
    public function send(string $phone, string $message): void
    {
        $client = new SnsClient([
            'version' => 'latest',
            'region' => env('AWS_DEFAULT_REGION', 'af-south-1'),
        ]);

        $client->publish([
            'PhoneNumber' => $phone,
            'Message' => $message,
            'MessageAttributes' => [
                'AWS.SNS.SMS.SMSType' => [
                    'DataType' => 'String',
                    'StringValue' => 'Transactional',
                ],
            ],
        ]);
    }
}
