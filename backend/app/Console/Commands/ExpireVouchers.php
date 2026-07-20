<?php

namespace App\Console\Commands;

use App\Models\Voucher;
use Illuminate\Console\Command;

class ExpireVouchers extends Command
{
    /** @var string */
    protected $signature = 'vouchers:expire';

    /** @var string */
    protected $description = 'Mark active vouchers past their expiry date as expired';

    public function handle(): int
    {
        $count = Voucher::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        $this->info("Expired {$count} voucher(s).");

        return self::SUCCESS;
    }
}
