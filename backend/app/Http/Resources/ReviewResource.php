<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'rating' => $this->rating,
            'cleanliness_rating' => $this->cleanliness_rating,
            'staff_rating' => $this->staff_rating,
            'value_rating' => $this->value_rating,
            'wait_time_rating' => $this->wait_time_rating,
            'comment' => $this->comment,
            'is_verified' => $this->is_verified,
            'created_at' => $this->created_at,
        ];
    }
}
