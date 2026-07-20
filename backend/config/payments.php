<?php

use App\Payments\Drivers\SandboxGateway;

return [

    /*
    |--------------------------------------------------------------------------
    | Default payment gateway
    |--------------------------------------------------------------------------
    |
    | Which App\Payments\Contracts\PaymentGateway driver handles booking
    | payments. Defaults to the sandbox driver — swap in a real SA gateway
    | (PayFast / Peach Payments / Paystack / Yoco / Ozow) once one is chosen
    | and its API keys are available, by adding a driver class below and
    | setting PAYMENT_GATEWAY in .env.
    |
    */

    'default' => env('PAYMENT_GATEWAY', 'sandbox'),

    'drivers' => [
        'sandbox' => SandboxGateway::class,
    ],

];
