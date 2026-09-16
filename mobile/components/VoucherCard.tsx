import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import type { WalletVoucher } from "@/lib/api";

interface Props {
  voucher: WalletVoucher;
  onShowCode?: () => void;
}

const SOURCE_LABEL: Record<WalletVoucher["source"], string> = {
  loyalty: "Loyalty reward — redeemable at any partner",
  promotion: "Promotion voucher",
  admin_grant: "Bonus voucher",
};

export function VoucherCard({ voucher, onShowCode }: Props) {
  const expiry = voucher.expires_at
    ? new Date(voucher.expires_at).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <View style={styles.row}>
      <LinearGradient
        colors={[colors.gold, colors.goldLight]}
        style={styles.chip}
      >
        <Text style={styles.chipText}>R{voucher.amount}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          R{voucher.amount} Wash Voucher
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {SOURCE_LABEL[voucher.source]}
        </Text>
        {expiry ? <Text style={styles.expiry}>Expires {expiry}</Text> : null}
      </View>
      <Pressable onPress={onShowCode} style={styles.action}>
        <Text style={styles.actionText}>Show code</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    padding: 14,
    marginBottom: 12,
    ...shadow.card,
  },
  chip: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontFamily: fonts.heading, fontSize: 13, color: colors.navy },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.headingSemi, fontSize: 14.5, color: colors.navyDeep },
  desc: { color: colors.greyText, fontSize: 12, marginTop: 2 },
  expiry: { color: colors.placeholderText, fontSize: 11.5, marginTop: 5 },
  action: {
    backgroundColor: colors.chipBlueBg,
    borderWidth: 1,
    borderColor: colors.chipBlueBorder,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  actionText: { color: colors.blue, fontSize: 12.5, fontFamily: fonts.headingSemi },
});
