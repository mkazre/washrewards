import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2, Ticket } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, WalletVoucher } from "@/lib/api";
import { PillButton } from "@/components/PillButton";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function RedeemVoucherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAppState();

  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<WalletVoucher | null>(null);

  async function redeem() {
    if (!token || !code.trim()) return;
    setRedeeming(true);
    setError(null);
    setRedeemed(null);
    try {
      const voucher = await api.partner.redeemVoucher(token, {
        code: code.trim().toUpperCase(),
      });
      setRedeemed(voucher);
      setCode("");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Couldn't redeem this voucher. Please try again."
      );
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Redeem a voucher" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <Ticket size={26} color={colors.gold} strokeWidth={1.7} />
        </View>
        <Text style={styles.subtitle}>
          Ask the customer for the code shown under their voucher's QR code,
          and enter it below.
        </Text>

        <Text style={styles.label}>Voucher code</Text>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          placeholder="e.g. WR-4F8K2Q1X"
          placeholderTextColor={colors.placeholderText}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {redeemed ? (
          <View style={styles.successCard}>
            <CheckCircle2 size={20} color={colors.green} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>R{redeemed.amount} voucher redeemed</Text>
              <Text style={styles.successSub}>Code {redeemed.code}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 22 }}>
          <PillButton
            label="Redeem"
            onPress={redeem}
            disabled={!code.trim() || redeeming}
            loading={redeeming}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#FEF3DC",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  subtitle: {
    marginTop: 14,
    color: colors.greyText,
    fontSize: 13.5,
    lineHeight: 19,
  },
  label: {
    marginTop: 22,
    fontSize: 12.5,
    fontFamily: fonts.headingSemi,
    color: colors.greyText3,
  },
  input: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.greyBorder,
    borderRadius: radii.md,
    backgroundColor: colors.greyBg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 17,
    letterSpacing: 1,
    fontFamily: fonts.headingSemi,
    color: colors.navyDeep,
  },
  errorText: { color: "#B91C1C", fontSize: 12.5, marginTop: 14 },
  successCard: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.greenBg,
    borderRadius: radii.lg,
    padding: 14,
  },
  successTitle: { fontFamily: fonts.headingSemi, fontSize: 14.5, color: colors.navyDeep },
  successSub: { color: colors.greyText, fontSize: 12.5, marginTop: 2 },
});
