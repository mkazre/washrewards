import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Delete } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "@/lib/theme";
import { api, ApiError } from "@/lib/api";
import { useAppState } from "@/lib/AppState";
import { AppLogo } from "@/components/AppLogo";

const CODE_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setSession } = useAppState();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(24);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (code.length === CODE_LENGTH) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function verify() {
    setVerifying(true);
    setError(null);
    try {
      const res = await api.auth.verifyOtp(`+27${phone}`, code);
      await setSession(res.token, res.user);
      router.replace("/(tabs)/home");
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : "Couldn't verify your code. Check your connection and try again.";
      setError(message);
      setCode("");
    } finally {
      setVerifying(false);
    }
  }

  function press(key: string) {
    if (verifying) return;
    if (key === "del") {
      setCode((c) => c.slice(0, -1));
      return;
    }
    if (key === "") return;
    setCode((c) => (c.length < CODE_LENGTH ? c + key : c));
  }

  async function resend() {
    if (seconds > 0 || resending) return;
    setResending(true);
    setError(null);
    setCode("");
    try {
      await api.auth.requestOtp(`+27${phone}`);
      setSeconds(24);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't resend the code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={20} color={colors.navyDeep} strokeWidth={2.2} />
        </Pressable>
        <AppLogo size={32} />
      </View>

      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>
        Enter the 4-digit PIN sent to{" "}
        <Text style={styles.phoneBold}>+27 {phone}</Text>
      </Text>

      <View style={styles.boxRow}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => {
          const filled = i < code.length;
          return (
            <View
              key={i}
              style={[
                styles.box,
                filled && styles.boxFilled,
                error && styles.boxError,
              ]}
            >
              <Text style={styles.boxChar}>{code[i] ?? ""}</Text>
            </View>
          );
        })}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.resend}>
          Didn't get it?{" "}
          <Text
            style={[styles.resendLink, seconds > 0 && { color: colors.placeholderText2 }]}
            onPress={resend}
          >
            {seconds > 0
              ? `Resend in 0:${String(seconds).padStart(2, "0")}`
              : resending
                ? "Sending…"
                : "Resend"}
          </Text>
        </Text>
      )}

      <View style={styles.keypad}>
        {KEYS.map((k, i) => (
          <Pressable
            key={i}
            onPress={() => press(k)}
            disabled={k === ""}
            style={({ pressed }) => [
              styles.key,
              pressed && k !== "" && { backgroundColor: "#EBEFF4" },
            ]}
          >
            {k === "del" ? (
              <Delete size={20} color={colors.navyDeep} strokeWidth={1.8} />
            ) : (
              <Text style={styles.keyLabel}>{k}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white, padding: 24, paddingTop: 14 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.greyBorderLight2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 22,
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.navyDeep,
  },
  subtitle: { marginTop: 6, color: colors.greyText, fontSize: 14, lineHeight: 20 },
  phoneBold: { color: colors.navyDeep, fontFamily: fonts.headingSemi },
  boxRow: { flexDirection: "row", gap: 12, marginTop: 28 },
  box: {
    flex: 1,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: { backgroundColor: colors.chipBlueBg, borderWidth: 1.5, borderColor: colors.blue },
  boxError: { backgroundColor: "#FDECEC", borderColor: "#DC2626" },
  boxChar: { fontFamily: fonts.heading, fontSize: 26, color: colors.navyDeep },
  resend: { marginTop: 18, color: colors.greyText2, fontSize: 13 },
  resendLink: { color: colors.blue, fontFamily: fonts.bodySemi },
  errorText: { marginTop: 18, color: "#B91C1C", fontSize: 13 },
  keypad: {
    marginTop: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  key: {
    width: "31%",
    height: 58,
    borderRadius: radii.lg,
    backgroundColor: colors.offWhite,
    alignItems: "center",
    justifyContent: "center",
  },
  keyLabel: { fontFamily: fonts.headingSemi, fontSize: 22, color: colors.navyDeep },
});
