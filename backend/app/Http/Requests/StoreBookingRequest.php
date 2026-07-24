<?php

namespace App\Http\Requests;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $tenant = Tenant::find($this->input('tenant_id'));
        $isMobileWash = $tenant?->isMobileWash() ?? false;

        return [
            'tenant_id' => ['required', Rule::exists('tenants', 'id')->where('status', 'active')],
            'service_id' => ['required', Rule::exists('services', 'id')->where('tenant_id', $this->input('tenant_id'))->where('is_active', true)],
            'vehicle_id' => ['required', Rule::exists('vehicles', 'id')->where('user_id', $this->user()->id)],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'service_address' => [Rule::requiredIf($isMobileWash), 'nullable', 'string', 'max:500'],
            'service_latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'service_longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'payment_method' => ['required', 'in:card,eft'],
        ];
    }
}
