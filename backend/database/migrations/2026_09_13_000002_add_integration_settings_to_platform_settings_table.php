<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every credential/toggle the admin Settings page needs for the new mobile
 * features, all nullable and encrypted-at-rest — the app keeps running on
 * the sandbox gateway / sandbox SMS sender until real values are entered
 * here (see PlatformSetting::effectivePaymentGateway()/effectiveSmsDriver()).
 * AWS IAM credentials themselves stay in .env/Secrets Manager (infra-level),
 * not here — these are business/merchant secrets.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->string('sms_driver')->default('sandbox')->after('voucher_expiry_days');
            $table->string('payment_gateway_default')->default('sandbox')->after('sms_driver');

            $table->text('payfast_merchant_id')->nullable()->after('payment_gateway_default');
            $table->text('payfast_merchant_key')->nullable();
            $table->text('payfast_passphrase')->nullable();

            $table->text('paystack_secret_key')->nullable();
            $table->text('paystack_public_key')->nullable();

            $table->text('ozow_site_code')->nullable();
            $table->text('ozow_private_key')->nullable();
            $table->text('ozow_api_key')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn([
                'sms_driver',
                'payment_gateway_default',
                'payfast_merchant_id',
                'payfast_merchant_key',
                'payfast_passphrase',
                'paystack_secret_key',
                'paystack_public_key',
                'ozow_site_code',
                'ozow_private_key',
                'ozow_api_key',
            ]);
        });
    }
};
