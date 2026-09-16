import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "@/lib/theme";
import { AppLogo } from "@/components/AppLogo";

/**
 * A full-screen overlay that appears the instant the device loses
 * connectivity and disappears the instant it's back — mounted once at the
 * root layout so it covers every screen in the app, not just one. Doesn't
 * distinguish "no signal" from "server down"; this is specifically about
 * the device's own network state (isConnected/isInternetReachable), which
 * is the case a user can actually act on (turn on wifi/data).
 */
export function NoInternetOverlay() {
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  async function retry() {
    setChecking(true);
    const state = await NetInfo.fetch();
    setIsOffline(state.isConnected === false || state.isInternetReachable === false);
    setChecking(false);
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <AppLogo size={44} />
      <View style={styles.iconWrap}>
        <WifiOff size={40} color={colors.gold} strokeWidth={1.6} />
      </View>
      <Text style={styles.title}>You're offline</Text>
      <Text style={styles.body}>
        WashRewards needs an internet connection to load car washes, bookings,
        and rewards. Check your Wi-Fi or mobile data and try again.
      </Text>
      <Pressable style={styles.retryBtn} onPress={retry} disabled={checking}>
        <Text style={styles.retryText}>{checking ? "Checking…" : "Try again"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    marginTop: 28,
    width: 92,
    height: 92,
    borderRadius: 30,
    backgroundColor: "rgba(245,158,11,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 24,
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.white,
  },
  body: {
    marginTop: 12,
    color: colors.mutedBlueGrey,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  retryBtn: {
    marginTop: 30,
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  retryText: { color: colors.navy, fontFamily: fonts.heading, fontSize: 15 },
});
