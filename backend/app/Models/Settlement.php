<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Settlement extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'period_start',
        'period_end',
        'gross_amount',
        'commission_amount',
        'travel_fee_amount',
        'net_payout',
        'status',
        'paid_at',
        'payout_reference',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'gross_amount' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'travel_fee_amount' => 'decimal:2',
            'net_payout' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
