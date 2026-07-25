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
    ];

    protected function casts(): array
    {
        return [
            'default_commission_rate' => 'decimal:2',
            'voucher_contribution_rate' => 'decimal:2',
            'voucher_amount' => 'decimal:2',
            'login_overlay_enabled' => 'boolean',
            'login_overlay_opacity' => 'integer',
        ];
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
