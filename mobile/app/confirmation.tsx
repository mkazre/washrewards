import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { PillButton } from "@/components/PillButton";
import { AppLogo } from "@/components/AppLogo";

export default function ConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingDraft, setBookingDraft } = useAppState();

  const rows: [string, string][] = [
    ["Partner", bookingDraft.tenant?.name ?? "—"],
    ["Package", bookingDraft.packageName ?? "—"],
    ["Today at", bookingDraft.slotLabel ?? "—"],
    ["Paid via", bookingDraft.payMethodLabel ?? "—"],
  ];

  function done() {
    setBookingDraft({
      tenant: undefined,
      packageId: undefined,
      packageName: undefined,
      packagePrice: undefined,
      slotLabel: undefined,
      payMethodLabel: undefined,
      bookingId: undefined,
      receiptNo: undefined,
    });
    router.replace("/(tabs)/home");
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.wrap,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 28 },
      ]}
    >
      <AppLogo size={40} />
      <View style={[styles.checkOuter, { marginTop: 18 }]}>
        <View style={styles.checkRing} />
        <View style={styles.checkCircle}>
          <Check size={44} color={colors.blue} strokeWidth={2.6} />
        </View>
      </View>

      <Text style={styles.title}>Payment successful</Text>
      <Text style={styles.subtitle}>
        Your wash is booked and paid. A digital receipt has been saved to
        your app.
      </Text>

      <View style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>Digital receipt</Text>
          <Text style={styles.receiptNo}>#{bookingDraft.receiptNo ?? "000000"}</Text>
        </View>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>{label}</Text>
            <Text style={styles.receiptValue}>{value}</Text>
          </View>
        ))}
        <View style={styles.receiptTotalRow}>
          <Text style={styles.receiptTotalLabel}>Amount paid</Text>
          <Text style={styles.receiptTotalValue}>{bookingDraft.packagePrice ?? "—"}</Text>
        </View>
      </View>

      <View style={styles.rewardBanner}>
        <View style={styles.rewardDot}>
          <Text style={styles.rewardDotText}>R</Text>
        </View>
        <Text style={styles.rewardText}>
          <Text style={{ fontFamily: fonts.headingSemi, color: colors.amberText }}>
            Wash counted!{" "}
          </Text>
          This paid wash counts toward your next R100 voucher.
        </Text>
      </View>

      <View style={{ width: "100%", marginTop: 18 }}>
        <PillButton label="Done" onPress={done} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    paddingTop: 40,
  },
  checkOuter: { width: 96, height: 96, alignItems: "center", justifyContent: "center" },
  checkRing: {
    position: "absolute",
    top: -7,
    left: -7,
    right: -7,
    bottom: -7,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.gold,
    opacity: 0.35,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 24, fontFamily: fonts.heading, fontSize: 23, color: colors.navyDeep },
  subtitle: { marginTop: 8, color: colors.greyText, fontSize: 14, lineHeight: 20, maxWidth: 252, textAlign: "center" },

  receiptCard: {
    width: "100%",
    marginTop: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    padding: 18,
  },
  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderBottomColor: "#DCE2EA",
  },
  receiptTitle: { fontFamily: fonts.headingSemi, fontSize: 13, color: colors.navyDeep },
  receiptNo: { color: colors.placeholderText2, fontSize: 12, fontFamily: fonts.headingMed },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  receiptLabel: { color: colors.placeholderText2, fontSize: 13 },
  receiptValue: { fontFamily: fonts.headingSemi, fontSize: 13.5, color: colors.navyDeep },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.greyBorderLight2,
  },
  receiptTotalLabel: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.navyDeep },
  receiptTotalValue: { fontFamily: fonts.heading, fontSize: 18, color: colors.blue },

  rewardBanner: {
    width: "100%",
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radii.md,
    padding: 14,
  },
  rewardDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardDotText: { color: colors.navy, fontFamily: fonts.heading, fontSize: 12 },
  rewardText: { flex: 1, fontSize: 12.5, color: colors.amberText, lineHeight: 18 },
});
