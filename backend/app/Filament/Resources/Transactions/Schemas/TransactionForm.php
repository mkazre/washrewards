<?php

namespace App\Filament\Resources\Transactions\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class TransactionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('tenant_id')
                    ->relationship('tenant', 'name')
                    ->required()
                    ->searchable(),
                Select::make('booking_id')
                    ->relationship('booking', 'id')
                    ->required()
                    ->searchable(),
                Select::make('user_id')
                    ->label('Customer')
                    ->relationship('user', 'name')
                    ->required()
                    ->searchable(),
                Select::make('settlement_id')
                    ->relationship('settlement', 'id')
                    ->searchable(),
                TextInput::make('gross_amount')
                    ->required()
                    ->numeric()
                    ->prefix('R'),
                TextInput::make('platform_commission')
                    ->required()
                    ->numeric()
                    ->prefix('R'),
                TextInput::make('voucher_contribution')
                    ->required()
                    ->numeric()
                    ->prefix('R')
                    ->default(0),
                TextInput::make('partner_earnings')
                    ->required()
                    ->numeric()
                    ->prefix('R'),
                Select::make('gateway')
                    ->options([
                        'payfast' => 'PayFast',
                        'peach_payments' => 'Peach Payments',
                        'paystack' => 'Paystack',
                        'yoco' => 'Yoco',
                        'ozow' => 'Ozow',
                    ])
                    ->required(),
                TextInput::make('gateway_reference')
                    ->helperText('External payment reference only — never raw card data'),
                Select::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'completed' => 'Completed',
                        'failed' => 'Failed',
                        'refunded' => 'Refunded',
                    ])
                    ->default('pending')
                    ->required(),
            ]);
    }
}
