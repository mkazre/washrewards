<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily settlement + voucher expiry, per the spec's scheduled-tasks list
// (§3: "Voucher expiry, daily settlement, reminders").
Schedule::command('settlements:generate')->dailyAt('01:00');
Schedule::command('vouchers:expire')->dailyAt('01:15');
