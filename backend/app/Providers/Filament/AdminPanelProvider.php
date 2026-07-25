<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use App\Models\PlatformSetting;
use Filament\Support\Colors\Color;
use Filament\Widgets\AccountWidget;
use Filament\Widgets\FilamentInfoWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->brandName('WashRewards SA')
            ->brandLogo(fn () => PlatformSetting::cached()?->logoUrl())
            ->brandLogoHeight('2.25rem')
            ->favicon(fn () => PlatformSetting::cached()?->faviconUrl())
            ->login()
            ->colors([
                'primary' => Color::hex('#F59E0B'),
                'gray' => Color::hex('#091830'),
            ])
            ->font('Inter')
            ->darkMode(condition: true, isForced: true)
            ->themeSwitcher(false)
            ->renderHook(
                \Filament\View\PanelsRenderHook::HEAD_END,
                fn () => '<link rel="stylesheet" href="'.asset('css/filament/admin-theme.css').'">',
            )
            ->renderHook(
                \Filament\View\PanelsRenderHook::HEAD_END,
                fn (): string => $this->loginBackgroundStyles(),
            )
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                AccountWidget::class,
                FilamentInfoWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }

    /**
     * Inline CSS that paints the admin login page background (and optional
     * colour overlay) from the platform settings. The selectors only match
     * Filament's simple/auth layout, so emitting this on every page is inert
     * everywhere except the sign-in screen.
     */
    protected function loginBackgroundStyles(): string
    {
        $settings = PlatformSetting::cached();
        $background = $settings?->loginBackgroundUrl();

        if (! $background) {
            return '';
        }

        // Emitted inside <style>, so sanitise rather than HTML-escape.
        $background = str_replace(['"', '<', '>', "\n", "\r"], '', $background);

        $css = '.fi-simple-layout{'
            .'background-image:url("'.$background.'");'
            .'background-size:cover;background-position:center;background-repeat:no-repeat;'
            .'}';

        if ($settings->login_overlay_enabled) {
            $color = preg_replace('/[^#0-9a-zA-Z(),.%\s]/', '', $settings->login_overlay_color ?: '#091830');
            $opacity = max(0, min(100, (int) $settings->login_overlay_opacity)) / 100;

            $css .= '.fi-simple-layout::before{content:"";position:fixed;inset:0;'
                .'background:'.$color.';opacity:'.$opacity.';pointer-events:none;z-index:0;}'
                .'.fi-simple-layout>*{position:relative;z-index:1;}';
        }

        return '<style>'.$css.'</style>';
    }
}
