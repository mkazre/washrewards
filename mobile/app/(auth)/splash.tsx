import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MapPin, CalendarCheck, Gift, BellRing } from "lucide-react-native";
import { colors, fonts, gradients, radii } from "@/lib/theme";
import { PillButton } from "@/components/PillButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// The pager sits inside `wrap`'s 34px side padding, so its actual on-screen
// width — and therefore both the page-to-page scroll distance and each
// slide's own width — is the screen width minus that padding on both sides.
const PAGE_WIDTH = SCREEN_WIDTH - 68;

const SLIDES = [
  {
    icon: MapPin,
    title: "Find washes near you",
    body: "Discover trusted car washes and mobile valets around you, sorted by real distance — list or map view.",
  },
  {
    icon: CalendarCheck,
    title: "Book in seconds",
    body: "Pick a package, choose a time, and pay securely by card or instant EFT — no calls, no waiting around.",
  },
  {
    icon: Gift,
    title: "Earn real rewards",
    body: "Every paid wash counts toward free vouchers and loyalty tiers, redeemable at any partner in the network.",
  },
  {
    icon: BellRing,
    title: "Stay in the loop",
    body: "Get instant updates the moment your wash is booked, in progress, or done — right on your lock screen.",
  },
];

export default function SplashScreenView() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  function goToLogin() {
    router.push("/(auth)/login");
  }

  function next() {
    if (isLast) {
      goToLogin();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * PAGE_WIDTH, animated: true });
  }

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setIndex(page);
  }

  return (
    <LinearGradient colors={gradients.splash} style={styles.wrap}>
      <View style={[styles.glow, styles.glowTop]} />
      <View style={[styles.glow, styles.glowBottom]} />

      <Pressable style={styles.skipBtn} onPress={goToLogin} hitSlop={10}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.wordmarkWrap}>
        <Image
          source={require("@/assets/logo-wordmark.png")}
          style={styles.wordmark}
          contentFit="contain"
        />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={[styles.pager, { width: PAGE_WIDTH }]}
      >
        {SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          return (
            <View key={i} style={[styles.slide, { width: PAGE_WIDTH }]}>
              <View style={styles.iconWrap}>
                <Icon size={34} color={colors.gold} strokeWidth={1.7} />
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideBody}>{slide.body}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={{ width: "100%", marginTop: 28 }}>
        <PillButton
          label={isLast ? "Get started" : "Next"}
          variant="primary"
          onPress={next}
        />
      </View>

      <Text style={styles.footer}>
        Already have an account?{" "}
        <Text style={styles.footerLink} onPress={goToLogin}>
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
  skipBtn: { position: "absolute", top: 54, right: 26 },
  skipText: { color: colors.mutedBlueGrey, fontSize: 13.5, fontFamily: fonts.headingSemi },
  wordmarkWrap: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  wordmark: { width: 176, height: 51 },
  pager: { marginTop: 30, flexGrow: 0 },
  slide: { alignItems: "center", paddingHorizontal: 8 },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "rgba(245,158,11,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  slideTitle: {
    marginTop: 22,
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.white,
    textAlign: "center",
  },
  slideBody: {
    marginTop: 12,
    color: colors.mutedBlueGrey,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: "center",
  },
  dotsRow: { flexDirection: "row", gap: 8, marginTop: 26 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: { width: 20, backgroundColor: colors.gold },
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
