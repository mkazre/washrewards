<?php

namespace App\Filament\Resources\Tenants\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Str;

class TenantForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Business details')
                    ->columns(2)
                    ->components([
                        TextInput::make('name')
                            ->required()
                            ->live(onBlur: true)
                            ->afterStateUpdated(fn ($state, callable $set) => $set('slug', Str::slug($state))),
                        TextInput::make('slug')
                            ->required()
                            ->unique(ignoreRecord: true),
                        Select::make('type')
                            ->options([
                                'fixed_garage' => 'Fixed garage',
                                'mobile_wash' => 'Mobile wash',
                            ])
                            ->required()
                            ->live(),
                        Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'active' => 'Active',
                                'suspended' => 'Suspended',
                            ])
                            ->default('pending')
                            ->required(),
                        TextInput::make('phone')->tel(),
                        TextInput::make('email')->email(),
                        Textarea::make('description')
                            ->columnSpanFull(),
                        FileUpload::make('logo_path')
                            ->image()
                            ->directory('tenants/logos')
                            // The media bucket blocks public ACLs (S3 Block Public
                            // Access) and is served through CloudFront's Origin
                            // Access Control instead — uploading with the
                            // default 'public' visibility asks S3 for a
                            // public-read ACL, which the bucket rejects outright.
                            ->visibility('private'),
                        FileUpload::make('cover_photo_path')
                            ->image()
                            ->directory('tenants/covers')
                            ->visibility('private'),
                    ]),

                Section::make('Commission')
                    ->columns(2)
                    ->components([
                        TextInput::make('commission_rate')
                            ->numeric()
                            ->suffix('%')
                            ->helperText('Leave blank to use the platform default rate'),
                        DateTimePicker::make('approved_at'),
                    ]),

                Section::make('Fixed garage location')
                    ->columns(2)
                    ->visible(fn (callable $get) => $get('type') === 'fixed_garage')
                    ->components([
                        TextInput::make('address')->columnSpanFull(),
                        TextInput::make('suburb'),
                        TextInput::make('city'),
                        TextInput::make('latitude')->numeric(),
                        TextInput::make('longitude')->numeric(),
                    ]),

                Section::make('Mobile wash coverage')
                    ->columns(2)
                    ->visible(fn (callable $get) => $get('type') === 'mobile_wash')
                    ->components([
                        TagsInput::make('service_areas')
                            ->helperText('Suburb / area names this mobile wash covers')
                            ->columnSpanFull(),
                        TextInput::make('travel_radius_km')
                            ->numeric()
                            ->suffix('km'),
                        TextInput::make('travel_fee')
                            ->numeric()
                            ->prefix('R'),
                    ]),

                Section::make('Opening hours')
                    ->components([
                        KeyValue::make('opening_hours')
                            ->keyLabel('Day')
                            ->valueLabel('Hours')
                            ->columnSpanFull(),
                    ])
                    ->collapsed(),
            ]);
    }
}
