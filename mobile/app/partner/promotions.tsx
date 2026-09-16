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
import { Pencil, Plus, Tag, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Promotion } from "@/lib/api";
import { PillButton } from "@/components/PillButton";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";
import { ScreenHeader } from "@/components/ScreenHeader";

type FormState = {
  title: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  code: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function inDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const emptyForm = (): FormState => ({
  title: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  code: "",
  starts_at: todayIso(),
  ends_at: inDaysIso(30),
  is_active: true,
});

export default function PartnerPromotionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAppState();

  const [promotions, setPromotions] = useState<Promotion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Promotion | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const list = await api.partner.promotions(token);
      setPromotions(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load your promotions.");
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
    setForm(emptyForm());
    setFormError(null);
    setEditing("new");
  }

  function openEdit(p: Promotion) {
    setForm({
      title: p.title,
      description: p.description ?? "",
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      code: p.code ?? "",
      starts_at: p.starts_at.slice(0, 10),
      ends_at: p.ends_at.slice(0, 10),
      is_active: p.is_active,
    });
    setFormError(null);
    setEditing(p);
  }

  async function save() {
    if (!token) return;
    const value = Number(form.discount_value);
    if (!form.title.trim() || !value || value <= 0) {
      setFormError("Title and a discount value above 0 are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        discount_type: form.discount_type,
        discount_value: value,
        code: form.code.trim() || undefined,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        is_active: form.is_active,
      };
      if (editing === "new") {
        await api.partner.createPromotion(token, payload);
      } else if (editing) {
        await api.partner.updatePromotion(token, editing.id, payload);
      }
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Couldn't save this promotion.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Promotion) {
    if (!token) return;
    try {
      await api.partner.deletePromotion(token, p.id);
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Couldn't remove this promotion.");
    }
  }

  if (editing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <ScreenHeader
          title={editing === "new" ? "New promotion" : "Edit promotion"}
          onBack={() => setEditing(null)}
        />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 28 }}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={form.title}
            onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            placeholder="e.g. Weekday special"
            placeholderTextColor={colors.placeholderText}
            style={styles.input}
          />
          <Text style={styles.label}>
            Description <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="What customers see"
            placeholderTextColor={colors.placeholderText}
            style={styles.input}
          />

          <Text style={styles.label}>Discount type</Text>
          <View style={styles.typeRow}>
            {(["percent", "fixed"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setForm((f) => ({ ...f, discount_type: t }))}
                style={[styles.typeChip, form.discount_type === t && styles.typeChipActive]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    form.discount_type === t && styles.typeChipTextActive,
                  ]}
                >
                  {t === "percent" ? "% off" : "R off"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>
            Discount value {form.discount_type === "percent" ? "(%)" : "(R)"}
          </Text>
          <TextInput
            value={form.discount_value}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, discount_value: v.replace(/[^0-9.]/g, "") }))
            }
            keyboardType="decimal-pad"
            placeholder={form.discount_type === "percent" ? "15" : "50"}
            placeholderTextColor={colors.placeholderText}
            style={styles.input}
          />

          <Text style={styles.label}>
            Promo code <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            value={form.code}
            onChangeText={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))}
            placeholder="e.g. WASH15"
            placeholderTextColor={colors.placeholderText}
            autoCapitalize="characters"
            style={styles.input}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Starts</Text>
              <TextInput
                value={form.starts_at}
                onChangeText={(v) => setForm((f) => ({ ...f, starts_at: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.placeholderText}
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Ends</Text>
              <TextInput
                value={form.ends_at}
                onChangeText={(v) => setForm((f) => ({ ...f, ends_at: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.placeholderText}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
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
              <Text style={styles.deleteText}>Delete promotion</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.offWhite }}>
      <ScreenHeader
        title="Promotions"
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
        ) : !promotions || promotions.length === 0 ? (
          <EmptyState title="No promotions yet" message="Tap + to create your first offer." />
        ) : (
          promotions.map((p) => (
            <Pressable key={p.id} style={styles.row} onPress={() => openEdit(p)}>
              <View style={styles.rowIcon}>
                <Tag size={18} color={colors.gold} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowName}>{p.title}</Text>
                <Text style={styles.rowMeta}>
                  {p.discount_type === "percent" ? `${p.discount_value}% off` : `R${p.discount_value} off`}
                  {p.code ? ` · ${p.code}` : ""}
                  {!p.is_active ? " · Inactive" : ""}
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
  typeRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  typeChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.greyBorder,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  typeChipActive: { borderColor: colors.blue, backgroundColor: colors.chipBlueBg },
  typeChipText: { fontFamily: fonts.headingSemi, fontSize: 13.5, color: colors.navyDeep },
  typeChipTextActive: { color: colors.blue },
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
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#FEF3DC",
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontFamily: fonts.headingSemi, fontSize: 14.5, color: colors.navyDeep },
  rowMeta: { color: colors.greyText, fontSize: 12.5, marginTop: 3 },
});
