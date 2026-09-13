<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class PlatformSetting extends Model
{
    protected $fillable = [
        'default_commission_rate',
        'voucher_contribution_rate',
        'voucher_wash_threshold',
        'voucher_amount',
        'voucher_expiry_days',
        'logo_path',
        'favicon_path',
        'login_background_path',
        'login_overlay_enabled',
        'login_overlay_color',
        'login_overlay_opacity',
        'sms_driver',
        'payment_gateway_default',
        'payfast_merchant_id',
        'payfast_merchant_key',
        'payfast_passphrase',
        'paystack_secret_key',
        'paystack_public_key',
        'ozow_site_code',
        'ozow_private_key',
        'ozow_api_key',
    ];

    /**
     * Which gateway/SMS settings columns a given driver needs non-empty
     * before it's allowed to be the *effective* choice — see
     * effectivePaymentGateway()/effectiveSmsDriver() below.
     */
    private const GATEWAY_REQUIRED_FIELDS = [
        'payfast' => ['payfast_merchant_id', 'payfast_merchant_key'],
        'paystack' => ['paystack_secret_key', 'paystack_public_key'],
        'ozow' => ['ozow_site_code', 'ozow_private_key', 'ozow_api_key'],
    ];

    protected function casts(): array
    {
        return [
            'default_commission_rate' => 'decimal:2',
            'voucher_contribution_rate' => 'decimal:2',
            'voucher_amount' => 'decimal:2',
            'login_overlay_enabled' => 'boolean',
            'login_overlay_opacity' => 'integer',
            'payfast_merchant_id' => 'encrypted',
            'payfast_merchant_key' => 'encrypted',
            'payfast_passphrase' => 'encrypted',
            'paystack_secret_key' => 'encrypted',
            'paystack_public_key' => 'encrypted',
            'ozow_site_code' => 'encrypted',
            'ozow_private_key' => 'encrypted',
            'ozow_api_key' => 'encrypted',
        ];
    }

    /**
     * The gateway to actually charge through: the admin's chosen default,
     * unless its required credentials are still empty — in which case we
     * silently keep using the sandbox gateway rather than fail bookings.
     */
    public static function effectivePaymentGateway(): string
    {
        $settings = static::current();
        $chosen = $settings->payment_gateway_default ?: 'sandbox';

        if ($chosen === 'sandbox') {
            return 'sandbox';
        }

        $required = self::GATEWAY_REQUIRED_FIELDS[$chosen] ?? [];
        foreach ($required as $field) {
            if (blank($settings->{$field})) {
                return 'sandbox';
            }
        }

        return $chosen;
    }

    /**
     * The SMS driver to actually send OTPs through: 'sns' only once
     * explicitly selected in Settings (AWS credentials themselves live in
     * .env/Secrets Manager, not here, so there's nothing further to check).
     */
    public static function effectiveSmsDriver(): string
    {
        return static::current()->sms_driver ?: 'sandbox';
    }

    /**
     * Platform settings are a single-row table; fetch (or lazily create) it.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }

    /**
     * Per-request, boot-safe read used by the panel provider for branding.
     * Never creates rows and never throws before the table exists (e.g. during
     * migrations), so the admin panel keeps booting on a fresh database.
     */
    protected static ?self $cached = null;

    protected static bool $cachedLoaded = false;

    public static function cached(): ?self
    {
        if (! static::$cachedLoaded) {
            static::$cachedLoaded = true;

            try {
                if (Schema::hasTable('platform_settings')) {
                    static::$cached = static::query()->first();
                }
            } catch (\Throwable) {
                static::$cached = null;
            }
        }

        return static::$cached;
    }

    /**
     * Public URL for a stored branding file, or null. Reads the app's default
     * filesystem disk (S3 in production), matching how tenant media is served.
     */
    public function fileUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        try {
            return Storage::url($path);
        } catch (\Throwable) {
            return null;
        }
    }

    public function logoUrl(): ?string
    {
        return $this->fileUrl($this->logo_path);
    }

    public function faviconUrl(): ?string
    {
        return $this->fileUrl($this->favicon_path);
    }

    public function loginBackgroundUrl(): ?string
    {
        return $this->fileUrl($this->login_background_path);
    }
}
