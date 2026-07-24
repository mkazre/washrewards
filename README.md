# WashRewards SA

A two-sided car-wash booking & loyalty marketplace for South Africa.

## Repository layout

| Path | Description |
|------|-------------|
| `mobile/` | **React Native (Expo)** consumer + partner app. Built to match the prototype's look & feel; talks to the AWS-hosted API. |
| `prototype/` | The original HTML/JS design prototype (reference only). |
| `docs/` | Technical specification & hosting requirements. |
| `backend/` | *(planned)* Laravel API + Filament admin, hosted on AWS. |

## Mobile app (Expo)

```bash
cd mobile
npm install
npx expo start        # scan the QR with Expo Go (Android/iOS)
```

- **Stack:** Expo (React Native) + TypeScript, React Navigation, expo-linear-gradient, react-native-svg, Space Grotesk + Inter fonts.
- **API endpoint:** configured in `mobile/src/config.ts` (`API_BASE_URL`). Point it at the AWS API for production. While `USE_MOCK_DATA` is `true`, screens render from bundled sample data (`mobile/src/data/mock.ts`).

## Design system

All colors, fonts, and spacing are derived from the prototype and centralised in
`mobile/src/theme.ts` — the single source of visual truth.
