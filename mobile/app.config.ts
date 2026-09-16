import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "WashRewards SA",
  slug: "washrewards",
  scheme: "washrewards",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#091830",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "co.za.washrewards.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#091830",
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
        color: "#091830",
      },
    ],
    "@maplibre/maplibre-react-native",
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
