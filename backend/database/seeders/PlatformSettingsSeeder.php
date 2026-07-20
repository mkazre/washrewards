<?php

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class PlatformSettingsSeeder extends Seeder
{
    public function run(): void
    {
        PlatformSetting::query()->firstOrCreate([], [
            'default_commission_rate' => 15.00,
            'voucher_contribution_rate' => 20.00,
            'voucher_wash_threshold' => 5,
            'voucher_amount' => 100.00,
            'voucher_expiry_days' => 90,
        ]);
    }
}
