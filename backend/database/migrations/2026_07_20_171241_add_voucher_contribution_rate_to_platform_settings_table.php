<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->decimal('voucher_contribution_rate', 5, 2)->default(20.00)
                ->after('default_commission_rate')
                ->comment('Percentage of the platform commission (not gross) earmarked for the loyalty voucher pool');
        });
    }

    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn('voucher_contribution_rate');
        });
    }
};
