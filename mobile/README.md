# WashRewards SA — mobile app

A car-wash booking + loyalty marketplace app for South Africa, built with
Expo (React Native + TypeScript) and Expo Router.

Screens: Splash, Login/Signup (phone OTP), OTP entry, Home (voucher
balance, wash progress, nearby car washes), Rewards (loyalty tiers, wallet,
levels, activity), Partner Dashboard, Platform (owner) console with a
revenue projection calculator, Booking flow, Confirmation/receipt,
Notifications, and Rating.

## Requirements

- Node.js 18+ and npm
- The Expo Go app on your phone (easiest way to run this without any local
  native toolchain — no Xcode/Android Studio needed), or an
  Android/iOS simulator
- No global CLI install is required — all commands below use `npx`

## Getting started

```bash
cd mobile
npm install
npx expo start
```

This prints a QR code — scan it with the Expo Go app (iOS or Android) to
run the app on your phone, or press `a`/`i` in the terminal to launch an
Android/iOS emulator/simulator if you have one configured.

## Pointing the app at a different API base URL

The API base URL comes from `app.config.ts`'s `extra.apiBaseUrl`, which
reads the `EXPO_PUBLIC_API_BASE_URL` environment variable at start/build
time. It defaults to `https://api.washrewards.co.za/v1`.

To point at a local or staging backend:

```bash
EXPO_PUBLIC_API_BASE_URL="https://staging-api.washrewards.co.za/v1" npx expo start
```

On Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "https://staging-api.washrewards.co.za/v1"
npx expo start
```

The value is also configurable per EAS build profile in `eas.json` under
each profile's `env` block.

## Building a preview APK with EAS

1. Install nothing locally — EAS builds run in the cloud. You just need to
   authenticate:
   ```bash
   npx eas login
   ```
   or set the `EXPO_TOKEN` environment variable (from expo.dev → account
   settings → Access Tokens) if running non-interactively (e.g. CI):
   ```bash
   EXPO_TOKEN=xxxxx npx eas build -p android --profile preview
   ```
2. Kick off the build:
   ```bash
   npx eas build -p android --profile preview
   ```
   This uses the `preview` profile in `eas.json` (`distribution: internal`,
   `buildType: apk`), producing a directly-installable `.apk` rather than
   an `.aab`, with a link to download it once the build finishes.
3. The first time you build for this project, EAS will ask to create a
   project on expo.dev and will populate `extra.eas.projectId` — accept
   that, or set your own project ID in `app.config.ts` beforehand.

## Project structure

- `app/` — Expo Router file-based routes
  - `(auth)/` — splash, login, otp (pre-authentication stack)
  - `(tabs)/` — home, rewards, partner, platform (bottom tab bar)
  - `booking.tsx`, `confirmation.tsx`, `notifications.tsx`, `rating.tsx` —
    modal-presented routes
- `lib/api.ts` — typed fetch wrapper for the Laravel API (Sanctum bearer
  auth), with the full request/response contract
- `lib/AppState.tsx` — React Context for auth session (persisted via
  `expo-secure-store`), cached API summaries, and the in-flight booking
  draft
- `lib/theme.ts` — design tokens (colors, gradients, fonts, shadows) ported
  from the design source (`WashRewards SA.dc.html`)
- `components/` — shared UI: `Card`, `PillButton`, `StatChip`,
  `VoucherCard`, `Skeleton`/`SkeletonCard`, `ErrorState`/`EmptyState`,
  `ScreenHeader`, `StarRow`

## Notes on data and error states

The app calls the real API contract everywhere — there is no bundled fake
"real" data. Screens show:

- a skeleton loading state while a request is in flight,
- pull-to-refresh on list/dashboard screens,
- a friendly error state with a **Try again** button if a request fails
  (e.g. the backend isn't deployed yet), and
- an empty state (never fabricated content) when a list legitimately has
  zero items.

## Type-checking

```bash
npx tsc --noEmit
```

## Doctor

```bash
npx expo-doctor
```
