import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Car, Check, MapPin, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Booking } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PillButton } from "@/components/PillButton";
import { ErrorState } from "@/components/ErrorState";

const STEPS: { key: string; label: string }[] = [
  { key: "confirmed", label: "Booked" },
  { key: "checked_in", label: "In progress" },
  { key: "completed", label: "Done" },
];

export default function BookingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, setBookingDraft } = useAppState();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError(null);
    try {
      const b = await api.bookings.get(token, id);
      setBooking(b);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load this booking.");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmCancel() {
    Alert.alert("Cancel this booking?", "This can't be undone.", [
      { text: "Keep booking", style: "cancel" },
      { text: "Cancel booking", style: "destructive", onPress: cancel },
    ]);
  }

  async function cancel() {
    if (!token || !booking) return;
    setCancelling(true);
    try {
      const updated = await api.bookings.cancel(token, booking.id);
      setBooking(updated);
    } catch (e) {
      Alert.alert("Couldn't cancel", e instanceof ApiError ? e.message : "Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  function goRate() {
    if (!booking) return;
    setBookingDraft({
      tenant: booking.tenant,
      packageName: booking.service?.name,
      bookingId: booking.id,
      receiptNo: booking.receipt_no,
    });
    router.push("/rating");
  }

  const stepIndex = booking
    ? booking.status === "cancelled"
      ? -1
      : STEPS.findIndex((s) => s.key === booking.status)
    : -1;

  const canCancel = booking && ["pending", "confirmed"].includes(booking.status);
  const canRate = booking && booking.status === "completed" && booking.has_review === false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScreenHeader title="Booking details" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 28 }}>
        {loading ? null : error || !booking ? (
          <ErrorState message={error ?? "Booking not found."} onRetry={load} />
        ) : (
          <>
            <Text style={styles.receiptNo}>#{booking.receipt_no}</Text>
            <Text style={styles.tenantName}>{booking.tenant?.name ?? "—"}</Text>
            {booking.tenant?.suburb || booking.tenant?.city ? (
              <View style={styles.metaRow}>
                <MapPin size={13} color={colors.placeholderText} strokeWidth={1.8} />
                <Text style={styles.metaText}>{booking.tenant?.suburb ?? booking.tenant?.city}</Text>
              </View>
            ) : null}

            {booking.status === "cancelled" ? (
              <View style={styles.cancelledTag}>
                <X size={14} color="#B91C1C" strokeWidth={2.4} />
                <Text style={styles.cancelledText}>This booking was cancelled</Text>
              </View>
            ) : (
              <View style={styles.stepsRow}>
                {STEPS.map((s, i) => {
                  const done = i <= stepIndex;
                  return (
                    <View key={s.key} style={styles.stepItem}>
                      <View style={styles.stepLineRow}>
                        <View style={[styles.stepDot, done && styles.stepDotDone]}>
                          {done ? <Check size={11} color={colors.white} strokeWidth={3} /> : null}
                        </View>
                        {i < STEPS.length - 1 ? (
                          <View style={[styles.stepLine, i < stepIndex && styles.stepLineDone]} />
                        ) : null}
                      </View>
                      <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{s.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Package</Text>
                <Text style={styles.cardValue}>{booking.service?.name ?? "—"}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Date</Text>
                <Text style={styles.cardValue}>
                  {new Date(booking.scheduled_at).toLocaleString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {booking.vehicle ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Vehicle</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Car size={14} color={colors.greyText3} strokeWidth={1.8} />
                    <Text style={styles.cardValue}>
                      {booking.vehicle.name} · {booking.vehicle.plate}
                    </Text>
                  </View>
                </View>
              ) : null}
              {booking.service_address ? (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Address</Text>
                  <Text style={[styles.cardValue, { flex: 1, textAlign: "right" }]}>
                    {booking.service_address}
                  </Text>
                </View>
              ) : null}
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Payment</Text>
                <Text style={styles.cardValue}>
                  {booking.payment_status === "paid" ? "Paid" : "Unpaid"}
                  {booking.payment_method ? ` · ${booking.payment_method.toUpperCase()}` : ""}
                </Text>
              </View>
              <View style={[styles.cardRow, styles.cardTotalRow]}>
                <Text style={styles.cardTotalLabel}>Total</Text>
                <Text style={styles.cardTotalValue}>R{booking.total_amount}</Text>
              </View>
            </View>

            {canRate ? (
              <View style={{ marginTop: 18 }}>
                <PillButton label="Rate this wash" onPress={goRate} />
              </View>
            ) : null}
            {canCancel ? (
              <View style={{ marginTop: 12 }}>
                <PillButton
                  label={cancelling ? "Cancelling…" : "Cancel booking"}
                  variant="outline"
                  onPress={confirmCancel}
                  disabled={cancelling}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  receiptNo: { color: colors.placeholderText2, fontSize: 12.5, fontFamily: fonts.headingMed },
  tenantName: { marginTop: 4, fontFamily: fonts.heading, fontSize: 22, color: colors.navyDeep },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  metaText: { color: colors.greyText, fontSize: 13 },

  cancelledTag: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDECEC",
    borderRadius: radii.md,
    padding: 12,
  },
  cancelledText: { color: "#B91C1C", fontFamily: fonts.headingSemi, fontSize: 13 },

  stepsRow: { flexDirection: "row", marginTop: 24 },
  stepItem: { flex: 1, alignItems: "center" },
  stepLineRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.greyBg3,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotDone: { backgroundColor: colors.blue },
  stepLine: { flex: 1, height: 3, backgroundColor: colors.greyBg3 },
  stepLineDone: { backgroundColor: colors.blue },
  stepLabel: { marginTop: 8, fontSize: 11.5, color: colors.placeholderText2, textAlign: "center" },
  stepLabelDone: { color: colors.navyDeep, fontFamily: fonts.headingSemi },

  card: {
    marginTop: 24,
    backgroundColor: colors.offWhite,
    borderRadius: radii.xl,
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  cardLabel: { color: colors.greyText, fontSize: 13 },
  cardValue: { color: colors.navyDeep, fontFamily: fonts.headingSemi, fontSize: 13.5 },
  cardTotalRow: { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.greyBorderLight2 },
  cardTotalLabel: { color: colors.navyDeep, fontFamily: fonts.headingSemi, fontSize: 14 },
  cardTotalValue: { color: colors.blue, fontFamily: fonts.heading, fontSize: 19 },
});
