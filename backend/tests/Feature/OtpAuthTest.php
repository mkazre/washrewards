<?php

namespace Tests\Feature;

use App\Models\OtpCode;
use App\Models\User;
use App\Sms\Contracts\SmsSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OtpAuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Captures the message OtpService sends, so tests can pull the real
     * 4-digit code out of it instead of brute-forcing the hash.
     */
    private function captureSentSms(): \ArrayObject
    {
        $sent = new \ArrayObject;

        $this->app->bind(SmsSender::class, function () use ($sent) {
            return new class($sent) implements SmsSender
            {
                public function __construct(private \ArrayObject $sent) {}

                public function send(string $phone, string $message): void
                {
                    $this->sent[] = compact('phone', 'message');
                }
            };
        });

        return $sent;
    }

    private function extractCode(\ArrayObject $sent): string
    {
        preg_match('/(\d{4})/', $sent[0]['message'] ?? '', $matches);

        return $matches[1] ?? '';
    }

    public function test_requesting_an_otp_creates_a_hashed_code_for_the_phone(): void
    {
        $this->postJson('/api/auth/otp/request', ['phone' => '+27825550142'])->assertOk();

        $otp = OtpCode::where('phone', '+27825550142')->first();
        $this->assertNotNull($otp);
        $this->assertNull($otp->consumed_at);
        $this->assertTrue($otp->expires_at->isFuture());
    }

    public function test_verifying_the_correct_code_logs_in_and_creates_the_user_if_new(): void
    {
        $sent = $this->captureSentSms();
        $this->postJson('/api/auth/otp/request', ['phone' => '+27825550142'])->assertOk();
        $code = $this->extractCode($sent);
        $this->assertNotEmpty($code);

        $response = $this->postJson('/api/auth/otp/verify', ['phone' => '+27825550142', 'code' => $code]);

        $response->assertOk();
        $response->assertJsonStructure(['user', 'token']);
        $this->assertSame(1, User::where('phone', '+27825550142')->count());
    }

    public function test_verifying_an_incorrect_code_fails(): void
    {
        $this->postJson('/api/auth/otp/request', ['phone' => '+27825550142'])->assertOk();

        $this->postJson('/api/auth/otp/verify', ['phone' => '+27825550142', 'code' => '0000'])
            ->assertStatus(422);
    }

    public function test_verifying_without_requesting_first_fails(): void
    {
        $this->postJson('/api/auth/otp/verify', ['phone' => '+27825550199', 'code' => '1234'])
            ->assertStatus(422);
    }
}
