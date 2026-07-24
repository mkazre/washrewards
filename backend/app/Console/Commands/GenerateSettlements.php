<?php

namespace App\Console\Commands;

use App\Models\Settlement;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateSettlements extends Command
{
    /** @var string */
    protected $signature = 'settlements:generate {--date= : Date to settle, Y-m-d (defaults to yesterday)}';

    /** @var string */
    protected $description = "Batch each tenant's completed, unsettled transactions for a day into a settlement";

    public function handle(): int
    {
        $date = $this->option('date') ? Carbon::parse($this->option('date')) : Carbon::yesterday();
        $periodStart = $date->copy()->startOfDay();
        $periodEnd = $date->copy()->endOfDay();

        $tenantIds = Transaction::anyTenant()
            ->where('status', 'completed')
            ->whereNull('settlement_id')
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->distinct()
            ->pluck('tenant_id');

        $generated = 0;

        foreach ($tenantIds as $tenantId) {
            $transactions = Transaction::anyTenant()
                ->where('tenant_id', $tenantId)
                ->where('status', 'completed')
                ->whereNull('settlement_id')
                ->whereBetween('created_at', [$periodStart, $periodEnd])
                ->with('booking:id,travel_fee')
                ->get();

            if ($transactions->isEmpty()) {
                continue;
            }

            $settlement = Settlement::create([
                'tenant_id' => $tenantId,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'gross_amount' => $transactions->sum('gross_amount'),
                'commission_amount' => $transactions->sum('platform_commission'),
                'travel_fee_amount' => $transactions->sum(fn (Transaction $t) => (float) ($t->booking->travel_fee ?? 0)),
                'net_payout' => $transactions->sum('partner_earnings'),
                'status' => 'pending',
            ]);

            Transaction::anyTenant()
                ->whereIn('id', $transactions->pluck('id'))
                ->update(['settlement_id' => $settlement->id]);

            $generated++;
        }

        $this->info("Generated {$generated} settlement(s) for {$periodStart->toDateString()}.");

        return self::SUCCESS;
    }
}
