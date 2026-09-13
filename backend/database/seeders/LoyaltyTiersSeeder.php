<?php

namespace Database\Seeders;

use App\Models\LoyaltyTier;
use Illuminate\Database\Seeder;

class LoyaltyTiersSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            ['level' => 1, 'name' => 'Bronze', 'washes_required' => 1, 'reward_description' => 'Complimentary car spray', 'sort_order' => 1],
            ['level' => 2, 'name' => 'Silver', 'washes_required' => 3, 'reward_description' => 'Complimentary air freshener', 'sort_order' => 2],
            ['level' => 3, 'name' => 'Gold', 'washes_required' => 6, 'reward_description' => 'Free Basic Wash', 'sort_order' => 3],
            ['level' => 4, 'name' => 'Platinum', 'washes_required' => 10, 'reward_description' => 'R100 voucher on any package', 'sort_order' => 4],
            ['level' => 5, 'name' => 'Black', 'washes_required' => 15, 'reward_description' => 'Free Full Valet upgrade', 'sort_order' => 5],
        ];

        foreach ($tiers as $tier) {
            LoyaltyTier::query()->updateOrCreate(['level' => $tier['level']], $tier);
        }
    }
}
