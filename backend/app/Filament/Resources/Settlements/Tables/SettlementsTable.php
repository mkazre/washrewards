<?php

namespace App\Filament\Resources\Settlements\Tables;

use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class SettlementsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('tenant.name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('period_start')
                    ->date()
                    ->sortable(),
                TextColumn::make('period_end')
                    ->date()
                    ->sortable(),
                TextColumn::make('gross_amount')
                    ->money('ZAR')
                    ->sortable(),
                TextColumn::make('commission_amount')
                    ->money('ZAR')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('net_payout')
                    ->money('ZAR')
                    ->sortable()
                    ->weight('semibold'),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'paid' => 'success',
                        'failed' => 'danger',
                        'processing' => 'info',
                        default => 'gray',
                    }),
                TextColumn::make('paid_at')
                    ->dateTime()
                    ->sortable()
                    ->placeholder('Not yet paid'),
                TextColumn::make('payout_reference')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'processing' => 'Processing',
                        'paid' => 'Paid',
                        'failed' => 'Failed',
                    ]),
            ])
            ->recordActions([
                Action::make('markPaid')
                    ->label('Mark as paid')
                    ->icon('heroicon-o-banknotes')
                    ->color('success')
                    ->visible(fn ($record) => $record->status !== 'paid')
                    ->requiresConfirmation()
                    ->schema([
                        TextInput::make('payout_reference')
                            ->label('Payout reference')
                            ->helperText('EFT reference / bank transaction ID for this payout')
                            ->required(),
                    ])
                    ->action(function ($record, array $data) {
                        $record->update([
                            'status' => 'paid',
                            'paid_at' => now(),
                            'payout_reference' => $data['payout_reference'],
                        ]);

                        Notification::make()
                            ->title('Settlement marked as paid')
                            ->success()
                            ->send();
                    }),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('period_start', 'desc');
    }
}
