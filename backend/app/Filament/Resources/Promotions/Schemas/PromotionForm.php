<?php

namespace App\Filament\Resources\Promotions\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PromotionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('tenant_id')
                    ->relationship('tenant', 'name')
                    ->required()
                    ->searchable(),
                TextInput::make('title')
                    ->required(),
                Textarea::make('description')
                    ->columnSpanFull(),
                Select::make('discount_type')
                    ->options(['percent' => 'Percent', 'fixed' => 'Fixed'])
                    ->required(),
                TextInput::make('discount_value')
                    ->required()
                    ->numeric(),
                TextInput::make('code'),
                DateTimePicker::make('starts_at')
                    ->required(),
                DateTimePicker::make('ends_at')
                    ->required(),
                Toggle::make('is_active')
                    ->default(true),
                TextInput::make('usage_limit')
                    ->numeric()
                    ->helperText('Leave blank for unlimited uses'),
                TextInput::make('used_count')
                    ->numeric()
                    ->default(0)
                    ->disabled()
                    ->dehydrated(),
            ]);
    }
}
