<?php

namespace App\Services\Auth;

use App\Models\OtpCode;
use App\Models\User;
use App\Sms\Contracts\SmsSender;
use Illuminate\Support\Facades\Hash;

/**
 * Phone + OTP login: request() sends a 4-digit code via the configured
 * SmsSender (sandbox until AWS SNS is switched on in the admin Settings
 * page); verify() checks it and finds-or-creates the User by phone, mirroring
 * AuthController::register's Sanctum token issuance.
 */
class OtpService
{
    private const EXPIRY_MINUTES = 5;

    private const MAX_ATTEMPTS = 5;

    public function __construct(private readonly SmsSender $sms) {}

    /**
     * Returns the generated code so the caller can decide whether it's safe
     * to hand back to the client — see AuthController::requestOtp(), which
     * only ever does that while the sandbox driver is active (nothing was
     * actually texted, so there's nothing to leak by echoing it back).
     */
    public function request(string $phone): string
    {
        $code = (string) random_int(1000, 9999);

        OtpCode::updateOrCreate(
            ['phone' => $phone],
            [
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
                'consumed_at' => null,
            ]
        );

        $this->sms->send($phone, "Your WashRewards SA verification code is {$code}. It expires in ".self::EXPIRY_MINUTES.' minutes.');

        return $code;
    }

    /**
     * @return array{ok: bool, message: ?string}
     */
    public function verify(string $phone, string $code): array
    {
        $otp = OtpCode::where('phone', $phone)->latest('id')->first();

        if (! $otp || $otp->consumed_at) {
            return ['ok' => false, 'message' => 'Request a new code and try again.'];
        }

        if ($otp->expires_at->isPast()) {
            return ['ok' => false, 'message' => 'This code has expired. Request a new one.'];
        }

        if ($otp->attempts >= self::MAX_ATTEMPTS) {
            return ['ok' => false, 'message' => 'Too many attempts. Request a new code.'];
        }

        if (! Hash::check($code, $otp->code_hash)) {
            $otp->increment('attempts');

            return ['ok' => false, 'message' => 'Incorrect code.'];
        }

        $otp->update(['consumed_at' => now()]);

        return ['ok' => true, 'message' => null];
    }

    public function findOrCreateUser(string $phone): User
    {
        return User::firstOrCreate(
            ['phone' => $phone],
            ['name' => 'WashRewards Customer', 'email' => 'phone-'.$phone.'@placeholder.washrewards.co.za', 'password' => Hash::make(str()->random(32))]
        );
    }
}
