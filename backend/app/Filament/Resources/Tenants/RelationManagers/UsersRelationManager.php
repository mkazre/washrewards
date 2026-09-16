<?php

namespace App\Filament\Resources\Tenants\RelationManagers;

use Filament\Actions\AttachAction;
use Filament\Actions\DetachAction;
use Filament\Actions\DetachBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

/**
 * Lets an admin grant a user access to this tenant's Partner console
 * (mobile app + /partner API routes) by attaching them to the
 * tenant_user pivot — EnsurePartnerAccess only checks membership exists,
 * so this is the entire "how do I log in as a partner" mechanism.
 */
class UsersRelationManager extends RelationManager
{
    protected static string $relationship = 'users';

    protected static ?string $title = 'Partner access';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('role')
                ->options([
                    'owner' => 'Owner',
                    'staff' => 'Staff',
                ])
                ->required(),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                TextColumn::make('name')->searchable(),
                TextColumn::make('email')->searchable(),
                TextColumn::make('phone')->searchable(),
                TextColumn::make('pivot.role')->label('Role'),
            ])
            ->headerActions([
                AttachAction::make()
                    ->recordSelectSearchColumns(['name', 'email', 'phone'])
                    ->schema(fn (AttachAction $action) => [
                        $action->getRecordSelect(),
                        Select::make('role')
                            ->options([
                                'owner' => 'Owner',
                                'staff' => 'Staff',
                            ])
                            ->default('owner')
                            ->required(),
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
                DetachAction::make(),
            ])
            ->toolbarActions([
                DetachBulkAction::make(),
            ]);
    }
}
