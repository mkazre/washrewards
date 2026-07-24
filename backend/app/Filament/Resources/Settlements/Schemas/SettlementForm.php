<?php

namespace App\Filament\Resources\Settlements\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class SettlementForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('tenant_id')
                    ->relationship('tenant', 'name')
                    ->required(),
                DatePicker::make('period_start')
                    ->required(),
                DatePicker::make('period_end')
                    ->required(),
                TextInput::make('gross_amount')
                    ->required()
                    ->numeric()
                    ->prefix('R')
                    ->default(0.0),
                TextInput::make('commission_amount')
                    ->required()
                    ->numeric()
                    ->prefix('R')
                    ->default(0.0),
                TextInput::make('travel_fee_amount')
                    ->required()
                    ->numeric()
                    ->prefix('R')
                    ->default(0.0),
                TextInput::make('net_payout')
                    ->required()
                    ->numeric()
                    ->prefix('R')
                    ->default(0.0),
                Select::make('status')
                    ->options(['pending' => 'Pending', 'processing' => 'Processing', 'paid' => 'Paid', 'failed' => 'Failed'])
                    ->default('pending')
                    ->required(),
                DateTimePicker::make('paid_at'),
                TextInput::make('payout_reference'),
            ]);
    }
}
