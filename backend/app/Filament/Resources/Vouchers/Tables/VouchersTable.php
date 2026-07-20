<?php

namespace App\Filament\Resources\Vouchers\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class VouchersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user.name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('code')
                    ->searchable()
                    ->copyable(),
                TextColumn::make('amount')
                    ->money('ZAR')
                    ->sortable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'active' => 'success',
                        'redeemed' => 'gray',
                        'expired' => 'danger',
                    }),
                TextColumn::make('source')
                    ->badge()
                    ->toggleable(),
                TextColumn::make('earned_at')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('expires_at')
                    ->dateTime()
                    ->sortable()
                    ->placeholder('No expiry'),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'active' => 'Active',
                        'redeemed' => 'Redeemed',
                        'expired' => 'Expired',
                    ]),
                SelectFilter::make('source')
                    ->options([
                        'loyalty' => 'Loyalty',
                        'promotion' => 'Promotion',
                        'admin_grant' => 'Admin grant',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('earned_at', 'desc');
    }
}
