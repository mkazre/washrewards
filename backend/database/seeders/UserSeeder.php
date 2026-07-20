<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@washrewards.co.za'],
            [
                'name' => 'WashRewards Admin',
                'phone' => '+27 82 555 0100',
                'password' => 'password',
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        // The consumer shown throughout the prototype (home screen header,
        // rewards, ratings) — Sanele Dlamini, VW Polo Vivo · FH 21 RT GP.
        $sanele = User::updateOrCreate(
            ['email' => 'sanele@example.com'],
            [
                'name' => 'Sanele Dlamini',
                'phone' => '+27 82 555 0101',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        Vehicle::updateOrCreate(
            ['user_id' => $sanele->id, 'plate' => 'FH 21 RT GP'],
            ['make' => 'VW', 'model' => 'Polo Vivo', 'color' => 'White', 'is_default' => true]
        );

        // One owner per tenant, so each business can log in to the partner side of the app.
        foreach (Tenant::all() as $tenant) {
            $owner = User::updateOrCreate(
                ['email' => $tenant->email],
                [
                    'name' => "{$tenant->name} Owner",
                    'phone' => '+27 82 555 '.random_int(1000, 9999),
                    'password' => 'password',
                    'email_verified_at' => now(),
                ]
            );

            $tenant->users()->syncWithoutDetaching([$owner->id => ['role' => 'owner']]);
        }

        // Customers appearing in Sparkle & Shine's "today's bookings" and reviews.
        $customers = [
            ['name' => 'Thabo Mokoena', 'email' => 'thabo@example.com', 'make' => 'Toyota', 'model' => 'Corolla', 'plate' => 'CX 44 GH GP'],
            ['name' => 'Lerato Khumalo', 'email' => 'lerato@example.com', 'make' => 'Hyundai', 'model' => 'i20', 'plate' => 'DM 12 KL GP'],
            ['name' => 'Sipho Ndlovu', 'email' => 'sipho@example.com', 'make' => 'VW', 'model' => 'Golf', 'plate' => 'FP 88 NR GP'],
            ['name' => 'Aisha Patel', 'email' => 'aisha@example.com', 'make' => 'Suzuki', 'model' => 'Swift', 'plate' => 'GH 09 AP GP'],
            ['name' => 'Naledi Mahlangu', 'email' => 'naledi@example.com', 'make' => 'Ford', 'model' => 'Fiesta', 'plate' => 'JB 55 NM GP'],
            ['name' => 'Johan van der Merwe', 'email' => 'johan@example.com', 'make' => 'BMW', 'model' => '1 Series', 'plate' => 'KT 21 JV GP'],
        ];

        foreach ($customers as $customer) {
            $user = User::updateOrCreate(
                ['email' => $customer['email']],
                [
                    'name' => $customer['name'],
                    'phone' => '+27 82 555 '.random_int(1000, 9999),
                    'password' => 'password',
                    'email_verified_at' => now(),
                ]
            );

            Vehicle::updateOrCreate(
                ['user_id' => $user->id, 'plate' => $customer['plate']],
                ['make' => $customer['make'], 'model' => $customer['model'], 'is_default' => true]
            );
        }
    }
}
