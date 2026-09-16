import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/lib/theme";

/**
 * The real app icon (assets/icon.png) already has its navy background baked
 * in — this wraps it in a matching navy container so it reads as one
 * continuous badge on the app's navy headers, with no seam or mismatched
 * corner. Use everywhere the brand mark should appear: tab headers, modal
 * ScreenHeaders, auth screens, onboarding, the splash equivalent, etc.
 */
export function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size * 0.28 },
      ]}
    >
      <Image
        source={require("../assets/icon.png")}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.navy,
    overflow: "hidden",
  },
});
