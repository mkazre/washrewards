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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Car } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, gradients, radii } from "@/lib/theme";
import { PillButton } from "@/components/PillButton";
import { api, ApiError } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullPhone = `+27${phone.replace(/\s/g, "")}`;

  async function sendOtp() {
    if (!phone.trim()) {
      setError("Enter your mobile number first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.auth.requestOtp(fullPhone);
      router.push({ pathname: "/(auth)/otp", params: { phone } });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Couldn't reach the server.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.wrap,
          { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 30 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={gradients.blueButton} style={styles.logo}>
          <Car size={30} color={colors.white} strokeWidth={1.7} />
        </LinearGradient>

        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Enter your mobile number to continue. We'll send a one-time PIN to
          verify it.
        </Text>

        <Text style={styles.label}>Mobile number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.flagBox}>
            <Text style={{ fontSize: 19 }}>🇿🇦</Text>
            <Text style={styles.code}>+27</Text>
          </View>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="82 555 0142"
            placeholderTextColor={colors.placeholderText}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={{ marginTop: 22 }}>
          <PillButton label="Send OTP" onPress={sendOtp} loading={loading} />
        </View>

        {/* Social sign-in (Google/Apple/Facebook) isn't implemented yet — it
            needs real OAuth app registrations, which requires decisions and
            credentials only the business can provide. Removed rather than
            shown as fake, non-functional buttons. */}

        <View style={{ flex: 1, minHeight: 20 }} />
        <Text style={styles.terms}>
          By continuing you agree to WashRewards' Terms and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 22,
    paddingBottom: 30,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 20,
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.navyDeep,
  },
  subtitle: {
    marginTop: 6,
    color: colors.greyText,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    marginTop: 26,
    fontSize: 12.5,
    fontFamily: fonts.headingSemi,
    color: colors.greyText3,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.greyBorder,
    borderRadius: radii.md,
    paddingLeft: 14,
    paddingVertical: 4,
    backgroundColor: colors.greyBg,
  },
  flagBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingRight: 11,
    borderRightWidth: 1,
    borderRightColor: colors.greyBorder,
  },
  code: { fontFamily: fonts.headingSemi, fontSize: 15, color: colors.navyDeep },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.headingSemi,
    paddingVertical: 13,
    paddingHorizontal: 8,
    color: colors.navyDeep,
  },
  errorText: { color: "#B91C1C", fontSize: 12.5, marginTop: 8 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 26,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.greyBorderLight2 },
  dividerText: { color: colors.placeholderText, fontSize: 12.5 },
  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  socialGlyph: { fontFamily: fonts.heading, fontSize: 16 },
  terms: {
    textAlign: "center",
    color: colors.placeholderText,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 24,
  },
});
