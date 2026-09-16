<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_admin' => (bool) $this->is_admin,
            // Every other tenant list in the API goes through
            // TenantSummaryResource (for logo_url, from_price, etc.) — this
            // was previously raw Eloquent JSON, which exposed logo_path (an
            // unusable storage key) instead of a real logo_url, so the
            // partner tab could never show a partner's own business logo.
            'tenants' => TenantSummaryResource::collection($this->whenLoaded('tenants')),
        ];
    }
}
