import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, radius, shadow } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password, password_confirmation: confirm });
      }
    } catch (e) {
      const err = e as ApiError;
      const first = err.errors ? Object.values(err.errors)[0]?.[0] : undefined;
      setError(first || err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.navy }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: 26 }} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <LinearGradient colors={[colors.amber, colors.amber2]} style={styles.brandMark}>
            <Text style={styles.brandMarkText}>W</Text>
          </LinearGradient>
          <Text style={styles.brand}>WashRewards</Text>
        </View>

        <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to book washes and earn R100 vouchers.' : 'Join to book washes, earn vouchers and track rewards.'}
        </Text>

        <View style={styles.form}>
          {mode === 'register' && (
            <Field label="Full name" value={name} onChangeText={setName} placeholder="Sanele Dlamini" autoCapitalize="words" />
          )}
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
          {mode === 'register' && (
            <Field label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="+27 82 000 0000" keyboardType="phone-pad" autoCapitalize="none" />
          )}
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry autoCapitalize="none" />
          {mode === 'register' && (
            <Field label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="••••••••" secureTextEntry autoCapitalize="none" />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.submit, busy && { opacity: 0.7 }]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => { setError(null); setMode(mode === 'login' ? 'register' : 'login'); }} style={{ marginTop: 22, alignItems: 'center' }}>
          <Text style={styles.switch}>
            {mode === 'login' ? "New to WashRewards? " : 'Already have an account? '}
            <Text style={styles.switchLink}>{mode === 'login' ? 'Create an account' : 'Sign in'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.onNavyMute2} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.navy, fontFamily: font.displayBold, fontSize: 20 },
  brand: { color: '#fff', fontFamily: font.display, fontSize: 18 },
  title: { color: '#fff', fontFamily: font.displayBold, fontSize: 28, marginTop: 36, letterSpacing: -0.4 },
  subtitle: { color: colors.onNavySoft, fontSize: 14.5, marginTop: 8, lineHeight: 21, fontFamily: font.body },
  form: { marginTop: 28, gap: 16 },
  label: { color: colors.onNavyMute, fontSize: 12, letterSpacing: 0.4, fontFamily: font.display },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 14, color: '#fff', fontSize: 15, fontFamily: font.body,
  },
  error: { color: '#FCA5A5', fontSize: 13.5, fontFamily: font.bodyMed },
  submit: { backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 17, alignItems: 'center', marginTop: 4, ...shadow.blue },
  submitText: { color: '#fff', fontSize: 16, fontFamily: font.display },
  switch: { color: colors.onNavySoft, fontSize: 14, fontFamily: font.body },
  switchLink: { color: colors.amber, fontFamily: font.bodySemi },
});
