import React, { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Service } from "@/lib/api";
import { PillButton } from "@/components/PillButton";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";
import { ScreenHeader } from "@/components/ScreenHeader";

type FormState = {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  is_popular: boolean;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  duration_minutes: "",
  is_popular: false,
  is_active: true,
};

export default function PartnerServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAppState();

  const [services, setServices] = useState<Service[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const list = await api.partner.services(token);
      setServices(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load your services.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openNew() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditing("new");
  }

  function openEdit(s: Service) {
    setForm({
      name: s.name,
      description: s.description ?? "",
      price: String(s.price),
      duration_minutes: s.duration_minutes ? String(s.duration_minutes) : "",
      is_popular: !!s.is_popular,
      is_active: true,
    });
    setFormError(null);
    setEditing(s);
  }

  async function save() {
    if (!token) return;
    const price = Number(form.price);
    const duration = Number(form.duration_minutes);
    if (!form.name.trim() || !price || price <= 0 || !duration || duration <= 0) {
      setFormError("Name, a price above R0, and a duration are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        duration_minutes: duration,
        is_popular: form.is_popular,
        is_active: form.is_active,
      };
      if (editing === "new") {
        await api.partner.createService(token, payload);
      } else if (editing) {
        await api.partner.updateService(token, editing.id, payload);
      }
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Couldn't save this service.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: Service) {
    if (!token) return;
    try {
      await api.partner.deleteService(token, s.id);
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Couldn't remove this service.");
    }
  }

  if (editing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <ScreenHeader
          title={editing === "new" ? "New service" : "Edit service"}
          onBack={() => setEditing(null)}
        />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 28 }}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="e.g. Full Valet"
            placeholderTextColor={colors.placeholderText}
            style={styles.input}
          />
          <Text style={styles.label}>
            Description <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="What's included"
            placeholderTextColor={colors.placeholderText}
            style={styles.input}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price (R)</Text>
              <TextInput
                value={form.price}
                onChangeText={(v) => setForm((f) => ({ ...f, price: v.replace(/[^0-9.]/g, "") }))}
                keyboardType="decimal-pad"
                placeholder="200"
                placeholderTextColor={colors.placeholderText}
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Duration (min)</Text>
              <TextInput
                value={form.duration_minutes}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, duration_minutes: v.replace(/[^0-9]/g, "") }))
                }
                keyboardType="number-pad"
                placeholder="45"
                placeholderTextColor={colors.placeholderText}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Mark as popular</Text>
            <Switch
              value={form.is_popular}
              onValueChange={(v) => setForm((f) => ({ ...f, is_popular: v }))}
              trackColor={{ true: colors.blue }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active (visible to customers)</Text>
            <Switch
              value={form.is_active}
              onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              trackColor={{ true: colors.blue }}
            />
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <View style={{ marginTop: 20 }}>
            <PillButton label="Save" onPress={save} loading={saving} />
          </View>
          {editing !== "new" ? (
            <Pressable style={styles.deleteBtn} onPress={() => remove(editing)}>
              <Trash2 size={16} color="#B91C1C" strokeWidth={2} />
              <Text style={styles.deleteText}>Delete service</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.offWhite }}>
      <ScreenHeader
        title="Manage services"
        onBack={() => router.back()}
        right={
          <Pressable onPress={openNew} hitSlop={8}>
            <Plus size={22} color={colors.white} strokeWidth={2.2} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !services || services.length === 0 ? (
          <EmptyState title="No services yet" message="Tap + to add your first package." />
        ) : (
          services.map((s) => (
            <Pressable key={s.id} style={styles.row} onPress={() => openEdit(s)}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowName}>{s.name}</Text>
                <Text style={styles.rowMeta}>
                  R{s.price}
                  {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
                </Text>
              </View>
              <Pencil size={17} color={colors.greyText3} strokeWidth={1.8} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 18, fontSize: 12.5, fontFamily: fonts.headingSemi, color: colors.greyText3 },
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
  switchRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: { fontFamily: fonts.headingMed, fontSize: 14, color: colors.navyDeep },
  errorText: { color: "#B91C1C", fontSize: 12.5, marginTop: 14 },
  deleteBtn: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
  },
  deleteText: { color: "#B91C1C", fontSize: 13.5, fontFamily: fonts.headingSemi },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  rowName: { fontFamily: fonts.headingSemi, fontSize: 14.5, color: colors.navyDeep },
  rowMeta: { color: colors.greyText, fontSize: 12.5, marginTop: 3 },
});
