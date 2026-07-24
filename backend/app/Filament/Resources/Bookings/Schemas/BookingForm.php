<?php

namespace App\Filament\Resources\Bookings\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class BookingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Booking')
                    ->columns(2)
                    ->components([
                        Select::make('tenant_id')
                            ->relationship('tenant', 'name')
                            ->required()
                            ->searchable(),
                        Select::make('user_id')
                            ->label('Customer')
                            ->relationship('user', 'name')
                            ->required()
                            ->searchable(),
                        Select::make('vehicle_id')
                            ->relationship('vehicle')
                            ->getOptionLabelFromRecordUsing(fn ($record) => "{$record->make} {$record->model} · {$record->plate}")
                            ->required()
                            ->searchable(),
                        Select::make('service_id')
                            ->relationship('service', 'name')
                            ->required()
                            ->searchable(),
                        Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'confirmed' => 'Confirmed',
                                'checked_in' => 'Checked in',
                                'in_progress' => 'In progress',
                                'completed' => 'Completed',
                                'cancelled' => 'Cancelled',
                            ])
                            ->default('pending')
                            ->required(),
                        DateTimePicker::make('scheduled_at')
                            ->required(),
                    ]),

                Section::make('Mobile wash location')
                    ->description('Only applies to bookings with a mobile wash tenant')
                    ->columns(2)
                    ->components([
                        Textarea::make('service_address')
                            ->columnSpanFull(),
                        TextInput::make('service_latitude')
                            ->numeric(),
                        TextInput::make('service_longitude')
                            ->numeric(),
                    ])
                    ->collapsed(),

                Section::make('Payment')
                    ->columns(2)
                    ->components([
                        TextInput::make('price')
                            ->required()
                            ->numeric()
                            ->prefix('R')
                            ->helperText('Service price snapshot at booking time'),
                        TextInput::make('travel_fee')
                            ->required()
                            ->numeric()
                            ->prefix('R')
                            ->default(0),
                        TextInput::make('total_amount')
                            ->required()
                            ->numeric()
                            ->prefix('R'),
                        Select::make('payment_status')
                            ->options([
                                'pending' => 'Pending',
                                'paid' => 'Paid',
                                'refunded' => 'Refunded',
                                'failed' => 'Failed',
                            ])
                            ->default('pending')
                            ->required(),
                        Select::make('payment_method')
                            ->options(['card' => 'Card', 'eft' => 'Instant EFT']),
                        Toggle::make('counts_toward_voucher')
                            ->helperText('Whether this paid wash counts toward the R100 loyalty voucher'),
                    ]),

                Section::make('Timeline')
                    ->columns(3)
                    ->components([
                        DateTimePicker::make('checked_in_at'),
                        DateTimePicker::make('completed_at'),
                        DateTimePicker::make('cancelled_at'),
                    ])
                    ->collapsed(),

                Textarea::make('notes')
                    ->columnSpanFull(),
            ]);
    }
}
