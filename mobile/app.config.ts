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
  plugins: ["expo-router", "expo-secure-store"],
  extra: {
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.washrewards.co.za/v1",
    eas: {
      projectId: "00000000-0000-0000-0000-000000000000",
    },
  },
};

export default config;
