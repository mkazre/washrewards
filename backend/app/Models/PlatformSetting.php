<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $fillable = [
        'default_commission_rate',
        'voucher_wash_threshold',
        'voucher_amount',
        'voucher_expiry_days',
    ];

    protected function casts(): array
    {
        return [
            'default_commission_rate' => 'decimal:2',
            'voucher_amount' => 'decimal:2',
        ];
    }

    /**
     * Platform settings are a single-row table; fetch (or lazily create) it.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }
}
