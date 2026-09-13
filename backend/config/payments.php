<?php

use App\Payments\Drivers\OzowGateway;
use App\Payments\Drivers\PayFastGateway;
use App\Payments\Drivers\PaystackGateway;
use App\Payments\Drivers\SandboxGateway;

return [

    /*
    |--------------------------------------------------------------------------
    | Default payment gateway
    |--------------------------------------------------------------------------
    |
    | Which App\Payments\Contracts\PaymentGateway driver handles booking
    | payments. The runtime choice normally comes from PlatformSetting::
    | effectivePaymentGateway() (see the admin Settings page's "Integrations
    | & payments" section) — this env value is only the fallback used before
    | that setting exists (e.g. very first boot / artisan commands run
    | outside a request).
    |
    */

    'default' => env('PAYMENT_GATEWAY', 'sandbox'),

    'drivers' => [
        'sandbox' => SandboxGateway::class,
        'payfast' => PayFastGateway::class,
        'paystack' => PaystackGateway::class,
        'ozow' => OzowGateway::class,
    ],

];
