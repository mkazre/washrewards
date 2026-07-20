<?php

namespace App\Filament\Resources\Vouchers\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class VoucherForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->required(),
                TextInput::make('code')
                    ->required(),
                TextInput::make('amount')
                    ->required()
                    ->numeric()
                    ->prefix('R')
                    ->default(100.0),
                Select::make('status')
                    ->options(['active' => 'Active', 'redeemed' => 'Redeemed', 'expired' => 'Expired'])
                    ->default('active')
                    ->required(),
                Select::make('source')
                    ->options(['loyalty' => 'Loyalty', 'promotion' => 'Promotion', 'admin_grant' => 'Admin grant'])
                    ->default('loyalty')
                    ->required(),
                Select::make('redeemed_booking_id')
                    ->relationship('redeemedBooking', 'id'),
                DateTimePicker::make('earned_at')
                    ->required(),
                DateTimePicker::make('expires_at'),
                DateTimePicker::make('redeemed_at'),
            ]);
    }
}
