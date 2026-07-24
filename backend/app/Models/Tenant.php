<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'type',
        'description',
        'logo_path',
        'cover_photo_path',
        'phone',
        'email',
        'status',
        'commission_rate',
        'address',
        'suburb',
        'city',
        'latitude',
        'longitude',
        'service_areas',
        'travel_radius_km',
        'travel_fee',
        'opening_hours',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'rating_avg' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'travel_radius_km' => 'decimal:2',
            'travel_fee' => 'decimal:2',
            'service_areas' => 'array',
            'opening_hours' => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function isFixedGarage(): bool
    {
        return $this->type === 'fixed_garage';
    }

    public function isMobileWash(): bool
    {
        return $this->type === 'mobile_wash';
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(Settlement::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
