<?php

use App\Sms\Drivers\SandboxSmsSender;
use App\Sms\Drivers\SnsSmsSender;

return [

    /*
    |--------------------------------------------------------------------------
    | Default SMS driver
    |--------------------------------------------------------------------------
    |
    | Which App\Sms\Contracts\SmsSender driver sends OTP codes. The runtime
    | choice normally comes from PlatformSetting::current()->sms_driver (see
    | the admin Settings page), so this env value is only the fallback used
    | before that setting exists (e.g. very first boot / artisan commands
    | run outside a request).
    |
    */

    'default' => env('SMS_DRIVER', 'sandbox'),

    'drivers' => [
        'sandbox' => SandboxSmsSender::class,
        'sns' => SnsSmsSender::class,
    ],

];
