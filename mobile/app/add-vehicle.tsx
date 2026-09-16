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
import { Car } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError } from "@/lib/api";
import { PillButton } from "@/components/PillButton";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function AddVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAppState();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !!(token && make.trim() && model.trim() && plate.trim() && !saving);

  async function save() {
    if (!token || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await api.vehicles.create(token, {
        make: make.trim(),
        model: model.trim(),
        plate: plate.trim().toUpperCase(),
        color: color.trim() || undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save your vehicle. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Add a vehicle" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <Car size={26} color={colors.blue} strokeWidth={1.7} />
        </View>
        <Text style={styles.subtitle}>
          We need at least one vehicle on your account before you can book a wash.
        </Text>

        <Text style={styles.label}>Make</Text>
        <TextInput
          value={make}
          onChangeText={setMake}
          placeholder="e.g. Volkswagen"
          placeholderTextColor={colors.placeholderText}
          style={styles.input}
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          value={model}
          onChangeText={setModel}
          placeholder="e.g. Polo Vivo"
          placeholderTextColor={colors.placeholderText}
          style={styles.input}
        />

        <Text style={styles.label}>Number plate</Text>
        <TextInput
          value={plate}
          onChangeText={setPlate}
          placeholder="e.g. FH 21 RT GP"
          placeholderTextColor={colors.placeholderText}
          autoCapitalize="characters"
          style={styles.input}
        />

        <Text style={styles.label}>
          Colour <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          value={color}
          onChangeText={setColor}
          placeholder="e.g. White"
          placeholderTextColor={colors.placeholderText}
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={{ marginTop: 22 }}>
          <PillButton label="Save vehicle" onPress={save} disabled={!canSave} loading={saving} />
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
    backgroundColor: colors.chipBlueBg,
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
    marginTop: 20,
    fontSize: 12.5,
    fontFamily: fonts.headingSemi,
    color: colors.greyText3,
  },
  optional: { color: colors.placeholderText, fontWeight: "400", fontSize: 12 },
  input: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: colors.greyBorder,
    borderRadius: radii.md,
    backgroundColor: colors.greyBg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: fonts.headingSemi,
    color: colors.navyDeep,
  },
  errorText: { color: "#B91C1C", fontSize: 12.5, marginTop: 14 },
});
