import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, shadow } from '../theme';
import { useAuth } from '../auth/AuthContext';
import * as api from '../api/endpoints';
import { ApiError } from '../api/client';

export default function AddVehicleScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { token } = useAuth();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    if (!make.trim() || !model.trim() || !plate.trim()) {
      setError('Make, model and number plate are required.');
      return;
    }
    setBusy(true);
    try {
      await api.createVehicle(token!, {
        make: make.trim(), model: model.trim(), color: color.trim() || undefined,
        plate: plate.trim().toUpperCase(), is_default: true,
      });
      nav.goBack();
    } catch (e) {
      const err = e as ApiError;
      const first = err.errors ? Object.values(err.errors)[0]?.[0] : undefined;
      setError(first || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Add vehicle</Text>
      </View>

      <View style={{ padding: 20, gap: 16 }}>
        <Field label="Make" value={make} onChangeText={setMake} placeholder="VW" autoCapitalize="words" />
        <Field label="Model" value={model} onChangeText={setModel} placeholder="Polo Vivo" autoCapitalize="words" />
        <Field label="Colour (optional)" value={color} onChangeText={setColor} placeholder="White" autoCapitalize="words" />
        <Field label="Number plate" value={plate} onChangeText={setPlate} placeholder="FH 21 RT GP" autoCapitalize="characters" />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.save, busy && { opacity: 0.7 }]} onPress={save} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save vehicle</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.inkMute} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontFamily: font.display, fontSize: 19 },
  label: { color: colors.inkSoft, fontSize: 12.5, fontFamily: font.display },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line2, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 14, color: colors.ink, fontSize: 15, fontFamily: font.body },
  error: { color: '#DC2626', fontSize: 13.5, fontFamily: font.bodyMed },
  save: { backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 17, alignItems: 'center', marginTop: 4, ...shadow.blue },
  saveText: { color: '#fff', fontSize: 16, fontFamily: font.display },
});
