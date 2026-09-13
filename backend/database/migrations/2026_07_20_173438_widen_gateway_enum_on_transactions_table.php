<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Adds 'sandbox' to the gateway enum for the local/dev SandboxGateway
     * driver (see App\Payments\Drivers\SandboxGateway) — kept distinct from
     * every real gateway value so a sandbox charge can never be mistaken for
     * a real one in transaction records. Raw SQL avoids requiring
     * doctrine/dbal just to redefine an enum's allowed values.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement(
            "ALTER TABLE transactions MODIFY gateway ENUM('payfast', 'peach_payments', 'paystack', 'yoco', 'ozow', 'sandbox') NOT NULL"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE transactions MODIFY gateway ENUM('payfast', 'peach_payments', 'paystack', 'yoco', 'ozow') NOT NULL"
        );
    }
};
