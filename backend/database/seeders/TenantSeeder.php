<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Mirrors the car washes shown in the WashRewards SA prototype
     * (docs/WashRewards SA.dc.html), plus one mobile-wash tenant to
     * exercise the mobile_wash side of the schema the prototype doesn't
     * visually demonstrate.
     */
    public function run(): void
    {
        $garages = [
            [
                'name' => 'Sparkle & Shine',
                'suburb' => 'Sandton City',
                'city' => 'Johannesburg',
                'latitude' => -26.1076,
                'longitude' => 28.0567,
                'rating_avg' => 4.8,
                'rating_count' => 326,
                'packages' => ['basic' => 59, 'valet' => 189, 'premium' => 349],
            ],
            [
                'name' => 'AquaJet Auto Spa',
                'suburb' => 'Rosebank',
                'city' => 'Johannesburg',
                'latitude' => -26.1467,
                'longitude' => 28.0436,
                'rating_avg' => 4.6,
                'rating_count' => 214,
                'packages' => ['basic' => 49, 'valet' => 159, 'premium' => 289],
            ],
            [
                'name' => 'Prestige Wash Co.',
                'suburb' => 'Melrose Arch',
                'city' => 'Johannesburg',
                'latitude' => -26.1339,
                'longitude' => 28.0678,
                'rating_avg' => 4.9,
                'rating_count' => 412,
                'packages' => ['basic' => 75, 'valet' => 239, 'premium' => 439],
            ],
            [
                'name' => 'DriveClean Express',
                'suburb' => 'Braamfontein',
                'city' => 'Johannesburg',
                'latitude' => -26.1929,
                'longitude' => 28.0305,
                'rating_avg' => 4.4,
                'rating_count' => 98,
                'packages' => ['basic' => 45, 'valet' => 145, 'premium' => 265],
            ],
        ];

        foreach ($garages as $garage) {
            $tenant = Tenant::updateOrCreate(
                ['slug' => str($garage['name'])->slug()],
                [
                    'name' => $garage['name'],
                    'type' => 'fixed_garage',
                    'description' => "{$garage['name']} — car wash and valet services in {$garage['suburb']}.",
                    'phone' => '011 555 '.random_int(1000, 9999),
                    'email' => str($garage['name'])->slug().'@washrewards-partners.co.za',
                    'status' => 'active',
                    'commission_rate' => 15.00,
                    'rating_avg' => $garage['rating_avg'],
                    'rating_count' => $garage['rating_count'],
                    'address' => "Shop 12, {$garage['suburb']}",
                    'suburb' => $garage['suburb'],
                    'city' => $garage['city'],
                    'latitude' => $garage['latitude'],
                    'longitude' => $garage['longitude'],
                    'opening_hours' => [
                        'Mon–Fri' => '07:00–18:00',
                        'Sat' => '08:00–16:00',
                        'Sun' => '09:00–14:00',
                    ],
                    'approved_at' => now()->subMonths(6),
                ]
            );

            $this->seedPackages($tenant, $garage['packages']);
        }

        $mobile = Tenant::updateOrCreate(
            ['slug' => 'sudsonwheels-mobile-wash'],
            [
                'name' => 'SudsOnWheels Mobile Wash',
                'type' => 'mobile_wash',
                'description' => 'We come to you — home, office or parking bay, anywhere in our coverage area.',
                'phone' => '011 555 7788',
                'email' => 'sudsonwheels@washrewards-partners.co.za',
                'status' => 'active',
                'commission_rate' => 15.00,
                'rating_avg' => 4.7,
                'rating_count' => 63,
                'service_areas' => ['Sandton', 'Rosebank', 'Fourways', 'Bryanston'],
                'travel_radius_km' => 15,
                'travel_fee' => 35.00,
                'approved_at' => now()->subMonths(2),
            ]
        );

        $this->seedPackages($mobile, ['basic' => 79, 'valet' => 219, 'premium' => 399]);
    }

    /**
     * @param  array{basic: int, valet: int, premium: int}  $prices
     */
    private function seedPackages(Tenant $tenant, array $prices): void
    {
        $services = [
            [
                'name' => 'Basic Wash',
                'description' => 'Exterior wash & hand dry',
                'price' => $prices['basic'],
                'duration_minutes' => 20,
                'is_popular' => false,
                'sort_order' => 1,
            ],
            [
                'name' => 'Full Valet',
                'description' => 'Interior + exterior + wax',
                'price' => $prices['valet'],
                'duration_minutes' => 45,
                'is_popular' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Premium Detail',
                'description' => 'Deep clean, polish & ceramic protect',
                'price' => $prices['premium'],
                'duration_minutes' => 90,
                'is_popular' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($services as $service) {
            $tenant->services()->updateOrCreate(
                ['name' => $service['name']],
                $service + ['is_active' => true]
            );
        }
    }
}
