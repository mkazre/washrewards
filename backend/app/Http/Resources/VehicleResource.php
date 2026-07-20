<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'make' => $this->make,
            'model' => $this->model,
            'name' => $this->name,
            'color' => $this->color,
            'plate' => $this->plate,
            'is_default' => $this->is_default,
            'created_at' => $this->created_at,
        ];
    }
}
