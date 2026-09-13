<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'code',
        'qr_token',
        'amount',
        'status',
        'source',
        'redeemed_booking_id',
        'earned_booking_id',
        'earned_at',
        'expires_at',
        'redeemed_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (Voucher $voucher) {
            $voucher->qr_token ??= Str::random(40);
        });
    }

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'earned_at' => 'datetime',
            'expires_at' => 'datetime',
            'redeemed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function redeemedBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'redeemed_booking_id');
    }

    public function earnedBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'earned_booking_id');
    }
}
