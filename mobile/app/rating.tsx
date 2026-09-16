import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StarRow } from "@/components/StarRow";
import { PillButton } from "@/components/PillButton";

const CATEGORIES = [
  { key: "cleanliness", name: "Cleanliness" },
  { key: "staff", name: "Staff friendliness" },
  { key: "value", name: "Value for money" },
  { key: "wait_time", name: "Wait time" },
] as const;

export default function RatingScreen() {
  const router = useRouter();
  const { token, bookingDraft } = useAppState();
  const [overall, setOverall] = useState(0);
  const [catRatings, setCatRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit = overall > 0 && !submitting;

  async function submit() {
    if (!token || !bookingDraft.bookingId) {
      setError("No recent paid wash found to review.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.bookings.review(token, bookingDraft.bookingId, {
        rating: overall,
        cleanliness_rating: catRatings.cleanliness ?? overall,
        staff_rating: catRatings.staff ?? overall,
        value_rating: catRatings.value ?? overall,
        wait_time_rating: catRatings.wait_time ?? overall,
        comment: comment.trim() || undefined,
      });
      setDone(true);
      setTimeout(() => router.back(), 900);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Couldn't submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.offWhite }}>
      <ScreenHeader title="Rate your wash" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <View style={styles.summaryCard}>
          <Text style={styles.pkgName}>{bookingDraft.packageName ?? "Your recent wash"}</Text>
          <Text style={styles.partnerName}>{bookingDraft.tenant?.name ?? ""}</Text>
          <View style={styles.verifiedTag}>
            <Check size={11} color={colors.green} strokeWidth={3} />
            <Text style={styles.verifiedText}>Verified — paid wash completed</Text>
          </View>
          <View style={{ marginTop: 18 }}>
            <StarRow value={overall} onChange={setOverall} size={38} gap={10} />
          </View>
          <Text style={styles.tapHint}>Tap to rate your overall experience</Text>
        </View>

        <Text style={styles.sectionTitle}>Rate the details</Text>
        <View style={styles.detailCard}>
          {CATEGORIES.map((c, i) => (
            <View
              key={c.key}
              style={[styles.detailRow, i === CATEGORIES.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Text style={styles.detailLabel}>{c.name}</Text>
              <StarRow
                value={catRatings[c.key] ?? 0}
                onChange={(v) => setCatRatings((prev) => ({ ...prev, [c.key]: v }))}
                size={20}
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Add a review <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share what stood out about your wash…"
          placeholderTextColor={colors.placeholderText}
          multiline
          style={styles.textarea}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {done ? <Text style={styles.doneText}>Thanks — your review was submitted!</Text> : null}

        <View style={{ marginTop: 16 }}>
          <PillButton
            label="Submit review"
            onPress={submit}
            disabled={!canSubmit}
            loading={submitting}
          />
        </View>
        <Text style={styles.footnote}>
          Only customers who completed a paid wash can review.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    padding: 18,
    alignItems: "center",
    ...shadow.card,
  },
  pkgName: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.navyDeep },
  partnerName: { color: colors.greyText, fontSize: 13, marginTop: 3 },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    backgroundColor: colors.greenBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedText: { color: colors.green, fontSize: 11, fontFamily: fonts.headingSemi },
  tapHint: { color: colors.placeholderText, fontSize: 12, marginTop: 4 },

  sectionTitle: { fontFamily: fonts.headingSemi, fontSize: 15, color: colors.navyDeep, marginTop: 22, marginBottom: 6 },
  optional: { color: colors.placeholderText, fontWeight: "400", fontSize: 12.5 },

  detailCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    paddingHorizontal: 16,
    ...shadow.card,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailLabel: { fontFamily: fonts.headingMed, fontSize: 13.5, color: colors.navyDeep },

  textarea: {
    height: 88,
    borderWidth: 1,
    borderColor: colors.greyBorder,
    borderRadius: radii.md,
    padding: 13,
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.navyDeep,
    backgroundColor: colors.white,
    textAlignVertical: "top",
  },
  errorText: { color: "#B91C1C", fontSize: 12.5, marginTop: 10 },
  doneText: { color: colors.green, fontSize: 12.5, marginTop: 10 },
  footnote: { textAlign: "center", color: colors.placeholderText, fontSize: 11.5, marginTop: 10 },
});
