<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'level',
        'name',
        'washes_required',
        'reward_description',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'washes_required' => 'integer',
            'sort_order' => 'integer',
        ];
    }
}
