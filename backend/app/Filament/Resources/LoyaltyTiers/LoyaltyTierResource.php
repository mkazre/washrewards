<?php

namespace App\Filament\Resources\LoyaltyTiers;

use App\Filament\Resources\LoyaltyTiers\Pages\CreateLoyaltyTier;
use App\Filament\Resources\LoyaltyTiers\Pages\EditLoyaltyTier;
use App\Filament\Resources\LoyaltyTiers\Pages\ListLoyaltyTiers;
use App\Filament\Resources\LoyaltyTiers\Schemas\LoyaltyTierForm;
use App\Filament\Resources\LoyaltyTiers\Tables\LoyaltyTiersTable;
use App\Models\LoyaltyTier;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class LoyaltyTierResource extends Resource
{
    protected static ?string $model = LoyaltyTier::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTrophy;

    protected static string|\UnitEnum|null $navigationGroup = 'Finance';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return LoyaltyTierForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return LoyaltyTiersTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListLoyaltyTiers::route('/'),
            'create' => CreateLoyaltyTier::route('/create'),
            'edit' => EditLoyaltyTier::route('/{record}/edit'),
        ];
    }
}
