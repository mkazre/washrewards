<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * AWS Location Service's public API keys are ~400+ characters on their own,
 * and the `encrypted` cast wraps the stored value in a larger JSON envelope
 * (iv/value/mac) on top of that — comfortably over the original
 * VARCHAR(255), which failed with "Data too long for column" the first
 * time a real key was saved. Raw SQL rather than Schema::table()->change()
 * to avoid adding doctrine/dbal as a dependency just for this one column;
 * skipped on SQLite (used in tests) since it has no real column-width limit
 * and no ALTER COLUMN TYPE support to run this against anyway.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE platform_settings MODIFY aws_location_api_key TEXT NULL');
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE platform_settings MODIFY aws_location_api_key VARCHAR(255) NULL');
    }
};
