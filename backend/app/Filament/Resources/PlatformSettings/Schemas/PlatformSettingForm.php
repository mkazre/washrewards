<?php

namespace App\Filament\Resources\PlatformSettings\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class PlatformSettingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('default_commission_rate')
                    ->required()
                    ->numeric()
                    ->suffix('%')
                    ->helperText('Applied when a tenant has no commission override')
                    ->default(15.0),
                TextInput::make('voucher_contribution_rate')
                    ->required()
                    ->numeric()
                    ->suffix('%')
                    ->helperText('Share of the platform commission (not gross) that funds the loyalty voucher pool')
                    ->default(20.0),
                TextInput::make('voucher_wash_threshold')
                    ->required()
                    ->numeric()
                    ->helperText('Paid washes required to earn a loyalty voucher')
                    ->default(5),
                TextInput::make('voucher_amount')
                    ->required()
                    ->numeric()
                    ->prefix('R')
                    ->default(100.0),
                TextInput::make('voucher_expiry_days')
                    ->required()
                    ->numeric()
                    ->suffix('days')
                    ->default(90),
            ]);
    }
}
