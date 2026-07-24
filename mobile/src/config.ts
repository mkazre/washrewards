// App configuration. The mobile app talks to the Laravel/Filament backend
// hosted on AWS. Swap API_BASE_URL to the deployed API endpoint for production.
//
// Local dev examples:
//   Android emulator  -> http://10.0.2.2:8000/api
//   iOS simulator     -> http://localhost:8000/api
//   Physical phone    -> http://<your-LAN-IP>:8000/api
// Production (AWS)    -> https://api.washrewards.co.za/api

import { Platform } from 'react-native';

const LOCAL = Platform.select({
  android: 'http://10.0.2.2:8000/api',
  ios: 'http://localhost:8000/api',
  default: 'http://localhost:8000/api',
})!;

// TODO: replace with the AWS API endpoint once the backend is deployed.
const PRODUCTION = 'https://api.washrewards.co.za/api';

export const API_BASE_URL = __DEV__ ? LOCAL : PRODUCTION;

// Until the backend is live, screens render from bundled mock data.
// Flip to false once the API endpoints are wired up.
export const USE_MOCK_DATA = true;
