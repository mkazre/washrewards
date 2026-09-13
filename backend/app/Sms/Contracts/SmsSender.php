<?php

namespace App\Sms\Contracts;

/**
 * Abstraction over the (not-yet-configured) SMS provider for OTP delivery —
 * mirrors App\Payments\Contracts\PaymentGateway. Defaults to the sandbox
 * driver until AWS SNS credentials exist and "Use AWS SNS for OTP" is
 * switched on in the admin Settings page.
 */
interface SmsSender
{
    public function send(string $phone, string $message): void;
}
