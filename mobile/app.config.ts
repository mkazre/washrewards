import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "WashRewards SA",
  slug: "washrewards",
  scheme: "washrewards",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  // Matches the navy baked into assets/splash.png (the app favicon) exactly,
  // so the letterboxed area around the icon is seamless — this is a couple
  // of RGB units off from the design system's colors.navy (#091830) used
  // everywhere else in the app, which is intentional here only.
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#05193B",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "co.za.washrewards.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#05193B",
    },
    package: "co.za.washrewards.app",
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-asset",
    "expo-apple-authentication",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#05193B",
      },
    ],
    "@maplibre/maplibre-react-native",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "WashRewards uses your location to show car washes near you and sort them by distance.",
      },
    ],
  ],
  owner: "mkazre",
  extra: {
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.washrewards.online/api",
    eas: {
      projectId: "6477705b-1e69-489f-a80f-4aa5e84ae74d",
    },
  },
};

export default config;
