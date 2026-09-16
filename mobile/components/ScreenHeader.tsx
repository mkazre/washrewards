import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/lib/theme";
import { AppLogo } from "@/components/AppLogo";

interface Props {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/** Compact navy back-header used on modal-presented screens (OTP, Notifications, Rating). */
export function ScreenHeader({ title, onBack, right }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={styles.backBtn}
        hitSlop={8}
      >
        <ChevronLeft size={20} color={colors.white} strokeWidth={2.2} />
      </Pressable>
      <AppLogo size={26} />
      <Text style={styles.title}>{title}</Text>
      {right ?? <View style={{ width: 38 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.navy,
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: colors.white,
    fontFamily: fonts.headingSemi,
    fontSize: 19,
  },
});
