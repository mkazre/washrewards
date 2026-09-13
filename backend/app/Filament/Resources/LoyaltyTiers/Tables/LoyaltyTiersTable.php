<?php

namespace App\Filament\Resources\LoyaltyTiers\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class LoyaltyTiersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('level')->sortable(),
                TextColumn::make('name')->searchable(),
                TextColumn::make('washes_required')->sortable(),
                TextColumn::make('reward_description')->wrap(),
                TextColumn::make('sort_order')->sortable()->toggleable(),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('sort_order');
    }
}
