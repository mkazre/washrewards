<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VoucherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'amount' => (float) $this->amount,
            'status' => $this->status,
            'source' => $this->source,
            'earned_at' => $this->earned_at,
            'expires_at' => $this->expires_at,
            'redeemed_at' => $this->redeemed_at,
        ];
    }
}
