<?php

namespace App\Filament\Resources\LoyaltyTiers\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class LoyaltyTierForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('level')
                    ->required()
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(255),
                TextInput::make('name')
                    ->required(),
                TextInput::make('washes_required')
                    ->label('Paid washes required (rolling 90 days)')
                    ->required()
                    ->numeric(),
                TextInput::make('reward_description')
                    ->required()
                    ->columnSpanFull(),
                TextInput::make('sort_order')
                    ->numeric()
                    ->default(0),
            ]);
    }
}
