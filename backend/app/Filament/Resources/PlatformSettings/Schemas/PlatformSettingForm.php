<?php

namespace App\Filament\Resources\PlatformSettings\Schemas;

use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Slider;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PlatformSettingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Loyalty & commission')
                    ->columns(2)
                    ->components([
                        TextInput::make('default_commission_rate')
                            ->required()
                            ->numeric()
                            ->suffix('%')
                            ->helperText('Applied when a tenant has no commission override')
                            ->default(15.0),
                        TextInput::make('voucher_contribution_rate')
                            ->required()
                            ->numeric()
                            ->suffix('%')
                            ->helperText('Share of the platform commission (not gross) that funds the loyalty voucher pool')
                            ->default(20.0),
                        TextInput::make('voucher_wash_threshold')
                            ->required()
                            ->numeric()
                            ->helperText('Paid washes required to earn a loyalty voucher')
                            ->default(5),
                        TextInput::make('voucher_amount')
                            ->required()
                            ->numeric()
                            ->prefix('R')
                            ->default(100.0),
                        TextInput::make('voucher_expiry_days')
                            ->required()
                            ->numeric()
                            ->suffix('days')
                            ->default(90),
                    ]),

                Section::make('Integrations & payments')
                    ->description('Real credentials for SMS delivery and payment gateways. Everything here is optional — WashRewards keeps using the built-in sandbox (which logs OTPs and auto-approves payments) for anything left blank, so it\'s safe to fill these in gradually.')
                    ->columns(2)
                    ->components([
                        Select::make('sms_driver')
                            ->label('OTP delivery')
                            ->options(['sandbox' => 'Sandbox (logs the code, does not send SMS)', 'sns' => 'AWS SNS (real SMS)'])
                            ->default('sandbox')
                            ->required()
                            ->helperText('AWS SNS uses the AWS credentials already configured for file storage — no extra keys needed here, just switch this on once those exist.')
                            ->columnSpanFull(),

                        Select::make('payment_gateway_default')
                            ->label('Active payment gateway')
                            ->options([
                                'sandbox' => 'Sandbox (auto-approves every payment)',
                                'payfast' => 'PayFast',
                                'paystack' => 'Paystack',
                                'ozow' => 'Ozow',
                            ])
                            ->default('sandbox')
                            ->required()
                            ->helperText('If the selected gateway is missing required keys below, WashRewards automatically keeps using the sandbox gateway instead of failing bookings.')
                            ->columnSpanFull(),

                        TextInput::make('payfast_merchant_id')->label('PayFast merchant ID')->password()->revealable(),
                        TextInput::make('payfast_merchant_key')->label('PayFast merchant key')->password()->revealable(),
                        TextInput::make('payfast_passphrase')->label('PayFast passphrase')->password()->revealable()
                            ->helperText('Optional — only if your PayFast account has a passphrase set.'),

                        TextInput::make('paystack_public_key')->label('Paystack public key')->password()->revealable(),
                        TextInput::make('paystack_secret_key')->label('Paystack secret key')->password()->revealable(),

                        TextInput::make('ozow_site_code')->label('Ozow site code')->password()->revealable(),
                        TextInput::make('ozow_api_key')->label('Ozow API key')->password()->revealable(),
                        TextInput::make('ozow_private_key')->label('Ozow private key')->password()->revealable(),
                    ]),

                Section::make('Admin branding')
                    ->description('Logo and favicon shown across the admin panel.')
                    ->columns(2)
                    ->components([
                        FileUpload::make('logo_path')
                            ->label('Logo')
                            ->image()
                            ->imageEditor()
                            // Deliberately no ->visibility() — the bucket has ACLs
                            // disabled entirely (Bucket owner enforced), so setting
                            // any visibility (even 'private') re-adds an ACL param
                            // that S3 rejects. See config/filesystems.php's s3 disk.
                            ->directory('platform/branding')
                            ->maxSize(2048)
                            ->helperText('Shown in the sidebar and on the login page. PNG or SVG on a transparent background works best.'),
                        FileUpload::make('favicon_path')
                            ->label('Favicon')
                            ->acceptedFileTypes(['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'])
                            ->directory('platform/branding')
                            ->maxSize(512)
                            ->helperText('The little icon in the browser tab. A square PNG (32×32 or 64×64) or .ico.'),
                    ]),

                Section::make('Login page')
                    ->description('Customise the background of the admin sign-in screen.')
                    ->columns(2)
                    ->components([
                        FileUpload::make('login_background_path')
                            ->label('Background image')
                            ->image()
                            ->imageEditor()
                            ->directory('platform/branding')
                            ->maxSize(6144)
                            ->columnSpanFull()
                            ->helperText('A wide, high-resolution image looks best (e.g. 1920×1080).'),
                        Toggle::make('login_overlay_enabled')
                            ->label('Add a colour overlay')
                            ->helperText('Darken or tint the image so the login form stays readable.')
                            ->live()
                            ->columnSpanFull(),
                        ColorPicker::make('login_overlay_color')
                            ->label('Overlay colour')
                            ->default('#091830')
                            ->visible(fn (callable $get) => (bool) $get('login_overlay_enabled')),
                        Slider::make('login_overlay_opacity')
                            ->label('Overlay opacity')
                            ->range(minValue: 0, maxValue: 100)
                            ->step(5)
                            ->default(40)
                            ->fillTrack()
                            ->tooltips()
                            ->helperText('How strong the colour overlay is, from transparent to fully opaque.')
                            ->visible(fn (callable $get) => (bool) $get('login_overlay_enabled')),
                    ]),
            ]);
    }
}
