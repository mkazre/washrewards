import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api } from "./api";

/**
 * Foreground display behaviour — without this, a push that arrives while
 * the app is open is silently swallowed instead of showing a WhatsApp-style
 * banner + sound.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests permission and returns an Expo push token, or null if denied /
 * running somewhere push can't work (simulator, web). Safe to call
 * repeatedly — Expo caches the token and permission prompts only appear
 * once per install.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return data;
  } catch {
    return null;
  }
}

/**
 * Registers this device's push token with the backend for the signed-in
 * user. Called after login and on every app launch while signed in — cheap
 * and idempotent server-side. Failures are swallowed: push is a nice-to-have
 * layered on top of the in-app notifications list, never something that
 * should block or error the rest of the app.
 */
export async function registerPushToken(authToken: string): Promise<string | null> {
  try {
    const expoPushToken = await getExpoPushToken();
    if (!expoPushToken) return null;

    await api.pushTokens.register(authToken, expoPushToken, Platform.OS as "ios" | "android");
    return expoPushToken;
  } catch {
    return null;
  }
}

export async function unregisterPushToken(authToken: string): Promise<void> {
  try {
    const expoPushToken = await getExpoPushToken();
    if (!expoPushToken) return;
    await api.pushTokens.unregister(authToken, expoPushToken);
  } catch {
    // best-effort
  }
}
