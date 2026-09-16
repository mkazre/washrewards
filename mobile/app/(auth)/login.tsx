import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { colors, fonts, radii } from "@/lib/theme";
import { PillButton } from "@/components/PillButton";
import { api, ApiError } from "@/lib/api";
import { useAppState } from "@/lib/AppState";

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_DISCOVERY = {
  authorizationEndpoint: "https://www.facebook.com/v19.0/dialog/oauth",
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { config, setSession } = useAppState();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const google = config?.social_login.google;
  // expo-apple-authentication only works on iOS — Android has no native
  // "Sign in with Apple" support to hook into, so the toggle in Settings is
  // effectively iOS-only regardless of what it says.
  const apple = Platform.OS === "ios" ? config?.social_login.apple : null;
  const facebook = config?.social_login.facebook;
  const anySocial = !!(google || apple || facebook);

  const [googleRequest, , promptGoogle] = Google.useIdTokenAuthRequest({
    clientId: google?.client_id ?? "unconfigured",
  });

  const [fbRequest, , promptFacebook] = AuthSession.useAuthRequest(
    {
      clientId: facebook?.app_id ?? "unconfigured",
      scopes: ["public_profile", "email"],
      responseType: AuthSession.ResponseType.Token,
      redirectUri: AuthSession.makeRedirectUri(),
    },
    FACEBOOK_DISCOVERY
  );

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

  async function finishSocialLogin(provider: string, token: string, name?: string | null) {
    try {
      const res = await api.auth.socialLogin(provider, token, name ?? undefined);
      await setSession(res.token, res.user);
      router.replace("/(tabs)/home");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Couldn't sign in with ${provider}.`);
    } finally {
      setSocialLoading(null);
    }
  }

  async function signInWithGoogle() {
    if (!googleRequest) return;
    setError(null);
    setSocialLoading("google");
    const result = await promptGoogle();
    if (result.type === "success" && result.params.id_token) {
      await finishSocialLogin("google", result.params.id_token);
    } else {
      setSocialLoading(null);
    }
  }

  async function signInWithFacebook() {
    if (!fbRequest) return;
    setError(null);
    setSocialLoading("facebook");
    const result = await promptFacebook();
    if (result.type === "success" && result.params.access_token) {
      await finishSocialLogin("facebook", result.params.access_token);
    } else {
      setSocialLoading(null);
    }
  }

  async function signInWithApple() {
    setError(null);
    setSocialLoading("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error("No identity token returned.");
      }
      const name = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ")
        : null;
      await finishSocialLogin("apple", credential.identityToken, name);
    } catch (e: any) {
      setSocialLoading(null);
      if (e?.code !== "ERR_REQUEST_CANCELED") {
        setError("Couldn't sign in with Apple.");
      }
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
        <View style={styles.wordmarkWrap}>
          <Image source={require("@/assets/logo-wordmark.png")} style={styles.wordmark} contentFit="contain" />
        </View>

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

        {anySocial ? (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialRow}>
              {google ? (
                <Pressable
                  style={[styles.socialBtn, { borderColor: colors.greyBorder }]}
                  onPress={signInWithGoogle}
                  disabled={!!socialLoading}
                >
                  <Text style={styles.socialGlyph}>
                    {socialLoading === "google" ? "…" : "G"}
                  </Text>
                </Pressable>
              ) : null}
              {apple ? (
                <Pressable
                  style={[styles.socialBtn, { borderColor: colors.greyBorder }]}
                  onPress={signInWithApple}
                  disabled={!!socialLoading}
                >
                  <Text style={styles.socialGlyph}>
                    {socialLoading === "apple" ? "…" : "Apple"}
                  </Text>
                </Pressable>
              ) : null}
              {facebook ? (
                <Pressable
                  style={[styles.socialBtn, { borderColor: colors.greyBorder }]}
                  onPress={signInWithFacebook}
                  disabled={!!socialLoading}
                >
                  <Text style={[styles.socialGlyph, { color: "#1877F2" }]}>
                    {socialLoading === "facebook" ? "…" : "f"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}

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
  wordmarkWrap: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  wordmark: { width: 190, height: 55 },
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
    marginTop: 26,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.greyBorderLight2 },
  dividerText: { color: colors.placeholderText, fontSize: 12.5 },
  socialRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  socialBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  socialGlyph: { fontFamily: fonts.heading, fontSize: 16, color: colors.navyDeep },
  terms: {
    textAlign: "center",
    color: colors.placeholderText,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 24,
  },
});
