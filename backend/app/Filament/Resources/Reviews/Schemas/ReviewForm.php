<?php

namespace App\Filament\Resources\Reviews\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ReviewForm
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
                    ->relationship('user', 'name')
                    ->required()
                    ->searchable(),
                TextInput::make('rating')
                    ->required()
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(5),
                TextInput::make('cleanliness_rating')
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(5),
                TextInput::make('staff_rating')
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(5),
                TextInput::make('value_rating')
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(5),
                TextInput::make('wait_time_rating')
                    ->numeric()
                    ->minValue(1)
                    ->maxValue(5),
                Textarea::make('comment')
                    ->columnSpanFull(),
                Toggle::make('is_verified')
                    ->default(true)
                    ->helperText('Reviews only exist against completed, paid bookings'),
            ]);
    }
}
