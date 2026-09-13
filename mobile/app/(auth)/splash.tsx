import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Car } from "lucide-react-native";
import { colors, fonts, gradients } from "@/lib/theme";
import { PillButton } from "@/components/PillButton";

export default function SplashScreenView() {
  const router = useRouter();

  return (
    <LinearGradient colors={gradients.splash} style={styles.wrap}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <LinearGradient colors={gradients.blueButton} style={styles.logo}>
        <Car size={44} color={colors.white} strokeWidth={1.7} />
      </LinearGradient>

      <Text style={styles.title}>WashRewards</Text>
      <Text style={styles.subtitle}>SOUTH AFRICA</Text>
      <Text style={styles.tagline}>
        A premium wash at your doorstep — book, track and earn rewards,
        anywhere in Gauteng.
      </Text>

      <View style={{ width: "100%", marginTop: 36 }}>
        <PillButton
          label="Get started"
          variant="primary"
          onPress={() => router.push("/(auth)/login")}
        />
      </View>

      <Text style={styles.footer}>
        Already have an account?{" "}
        <Text
          style={styles.footerLink}
          onPress={() => router.push("/(auth)/login")}
        >
          Sign in
        </Text>
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
    paddingVertical: 40,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(245,158,11,0.22)",
  },
  glowTop: { top: -60, right: -50 },
  glowBottom: {
    bottom: -40,
    left: -60,
    backgroundColor: "rgba(36,99,235,0.2)",
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 26,
    fontFamily: fonts.heading,
    fontSize: 32,
    color: colors.white,
  },
  subtitle: {
    color: colors.gold,
    fontFamily: fonts.headingSemi,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 8,
  },
  tagline: {
    color: colors.mutedBlueGrey,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 20,
    maxWidth: 270,
    textAlign: "center",
  },
  footer: {
    color: colors.mutedBlueGrey2,
    fontSize: 13,
    marginTop: 18,
  },
  footerLink: {
    color: colors.white,
    fontFamily: fonts.bodySemi,
    fontWeight: "600",
  },
});
