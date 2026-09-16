import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Car, Check, MapPin, ShieldCheck, Star, X } from "lucide-react-native";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Service, Vehicle } from "@/lib/api";
import { PillButton } from "@/components/PillButton";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";

const SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
const PAY_METHODS = [
  { id: "card", brand: "VISA", label: "Visa •••• 4827", num: "Expires 09/28" },
  { id: "eft", brand: "EFT", label: "Instant EFT", num: "Ozow / PayFast" },
  { id: "wallet", brand: "WR", label: "WashRewards wallet", num: "Balance R0" },
];

export default function BookingScreen() {
  const router = useRouter();
  const { token, bookingDraft, setBookingDraft } = useAppState();
  const tenant = bookingDraft.tenant;

  const [services, setServices] = useState<Service[] | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPay, setSelectedPay] = useState(PAY_METHODS[0].id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!tenant) {
        setLoading(false);
        return;
      }
      try {
        const [detail, vehicles] = await Promise.all([
          api.tenants.get(token, tenant.id),
          token ? api.vehicles.list(token) : Promise.resolve([]),
        ]);
        setServices(detail.services ?? []);
        setVehicle(vehicles[0] ?? null);
      } catch (e) {
        setError(
          e instanceof ApiError ? e.message : "Couldn't load this partner's packages."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [tenant, token]);

  if (!tenant) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white, padding: 22, justifyContent: "center" }}>
        <EmptyState title="No car wash selected" message="Go back and choose a car wash to book." />
      </View>
    );
  }

  async function confirm() {
    if (!token || !selectedService || !selectedSlot || !vehicle || !tenant) return;
    setSubmitting(true);
    try {
      const scheduledAt = new Date();
      const [h, m] = selectedSlot.split(":").map(Number);
      scheduledAt.setHours(h, m, 0, 0);

      const booking = await api.bookings.create(token, {
        tenant_id: tenant.id,
        vehicle_id: vehicle.id,
        service_id: selectedService.id,
        scheduled_at: scheduledAt.toISOString(),
        // "wallet" isn't a real gateway yet — treat it as card for now.
        payment_method: selectedPay === "eft" ? "eft" : "card",
      });
      const payLabel =
        PAY_METHODS.find((p) => p.id === selectedPay)?.label ?? "Card";
      await api.bookings.pay(token, booking.id, { payload: { method: selectedPay } });

      setBookingDraft({
        packageName: selectedService.name,
        packagePrice: `R${selectedService.price}`,
        slotLabel: selectedSlot,
        payMethodLabel: payLabel,
        bookingId: booking.id,
        receiptNo: String(booking.id).padStart(6, "0"),
      });
      router.replace("/confirmation");
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Couldn't complete your booking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const canConfirm = !!(selectedService && selectedSlot);

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.hero}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <X size={20} color={colors.white} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.tenantName}>{tenant.name}</Text>
              <View style={styles.areaRow}>
                <MapPin size={13} color={colors.placeholderText} strokeWidth={1.8} />
                <Text style={styles.areaText}>
                  {tenant.suburb ?? tenant.city ?? "—"}
                  {tenant.distance_km ? ` · ${tenant.distance_km.toFixed(1)} km` : ""}
                </Text>
              </View>
            </View>
            <View style={styles.ratingTag}>
              <Star size={13} color={colors.gold} fill={colors.gold} />
              <Text style={styles.ratingTagText}>{tenant.rating_avg?.toFixed(1) ?? "—"}</Text>
            </View>
          </View>

          {vehicle ? (
            <View style={styles.vehicleRow}>
              <Car size={20} color={colors.greyText3} strokeWidth={1.7} />
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleLabel}>Vehicle</Text>
                <Text style={styles.vehicleValue}>
                  {vehicle.name} · {vehicle.plate}
                </Text>
              </View>
              <Text style={styles.changeLink}>Change</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Choose a package</Text>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : error ? (
            <ErrorState message={error} />
          ) : !services || services.length === 0 ? (
            <EmptyState title="No packages available" message="This partner hasn't published any packages yet." />
          ) : (
            services.map((pk) => {
              const selected = selectedService?.id === pk.id;
              return (
                <Pressable
                  key={pk.id}
                  style={[styles.pkgCard, selected && styles.pkgCardSelected]}
                  onPress={() => setSelectedService(pk)}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <Check size={13} color={colors.white} strokeWidth={3} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.pkgName}>{pk.name}</Text>
                      {pk.is_popular ? (
                        <View style={styles.popularTag}>
                          <Text style={styles.popularTagText}>POPULAR</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.pkgDesc}>{pk.description ?? ""}</Text>
                    {pk.duration_minutes ? (
                      <Text style={styles.pkgTime}>≈ {pk.duration_minutes} min</Text>
                    ) : null}
                  </View>
                  <Text style={styles.pkgPrice}>R{pk.price}</Text>
                </Pressable>
              );
            })
          )}

          <Text style={styles.sectionTitle}>Available today</Text>
          <View style={styles.slotsGrid}>
            {SLOTS.map((s) => {
              const selected = selectedSlot === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setSelectedSlot(s)}
                  style={[styles.slotChip, selected && styles.slotChipSelected]}
                >
                  <Text style={[styles.slotLabel, selected && styles.slotLabelSelected]}>{s}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Payment method</Text>
          {PAY_METHODS.map((pm) => {
            const selected = selectedPay === pm.id;
            return (
              <Pressable
                key={pm.id}
                onPress={() => setSelectedPay(pm.id)}
                style={[styles.payCard, selected && styles.payCardSelected]}
              >
                <View style={styles.payBrand}>
                  <Text style={styles.payBrandText}>{pm.brand}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payLabel}>{pm.label}</Text>
                  <Text style={styles.payNum}>{pm.num}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <Check size={12} color={colors.white} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })}
          <View style={styles.secureRow}>
            <ShieldCheck size={13} color={colors.placeholderText} strokeWidth={1.8} />
            <Text style={styles.secureText}>Payments are encrypted and PCI-DSS secured.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.footerSummary}>
              {selectedService?.name ?? "Select a package"}
              {selectedSlot ? ` · ${selectedSlot}` : ""}
            </Text>
            <Text style={styles.footerPrice}>
              {selectedService ? `R${selectedService.price}` : "—"}
            </Text>
          </View>
        </View>
        <PillButton
          label={`Confirm & Pay${selectedService ? ` R${selectedService.price}` : ""}`}
          onPress={confirm}
          disabled={!canConfirm}
          loading={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 196, backgroundColor: colors.greyBg3, position: "relative" },
  closeBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(9,24,48,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  openTag: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(22,163,74,0.92)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  openTagText: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 11.5 },

  body: { padding: 22 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  tenantName: { fontFamily: fonts.heading, fontSize: 22, color: colors.navyDeep },
  areaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 5 },
  areaText: { color: colors.greyText, fontSize: 13 },
  ratingTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFF7E8", borderRadius: 11, paddingHorizontal: 11, paddingVertical: 7 },
  ratingTagText: { color: colors.amberText2, fontFamily: fonts.heading, fontSize: 13 },

  vehicleRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F7F8FA",
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.md,
    padding: 14,
  },
  vehicleLabel: { fontSize: 11.5, color: colors.placeholderText2 },
  vehicleValue: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.navyDeep },
  changeLink: { color: colors.blue, fontSize: 12.5, fontFamily: fonts.bodySemi },

  sectionTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.navyDeep, marginTop: 24, marginBottom: 12 },

  pkgCard: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    borderRadius: radii.xl,
    padding: 15,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.greyBorderLight,
  },
  pkgCardSelected: { borderColor: colors.blue, backgroundColor: colors.chipBlueBg },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.greyBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  pkgName: { fontFamily: fonts.headingSemi, fontSize: 15, color: colors.navyDeep },
  pkgDesc: { color: colors.greyText, fontSize: 12.5, marginTop: 3 },
  pkgTime: { color: colors.placeholderText, fontSize: 11.5, marginTop: 4 },
  pkgPrice: { fontFamily: fonts.heading, fontSize: 17, color: colors.navyDeep },
  popularTag: { backgroundColor: colors.navy, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  popularTagText: { color: colors.gold, fontFamily: fonts.headingSemi, fontSize: 9.5 },

  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotChip: {
    width: "31%",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.greyBorder,
    alignItems: "center",
  },
  slotChipSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  slotLabel: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.navyDeep },
  slotLabelSelected: { color: colors.white },

  payCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: radii.lg,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.greyBorderLight,
  },
  payCardSelected: { borderColor: colors.blue, backgroundColor: colors.chipBlueBg },
  payBrand: { width: 42, height: 30, borderRadius: 7, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  payBrandText: { color: colors.white, fontFamily: fonts.heading, fontSize: 10 },
  payLabel: { fontFamily: fonts.headingSemi, fontSize: 13.5, color: colors.navyDeep },
  payNum: { color: colors.placeholderText2, fontSize: 12, marginTop: 2 },
  secureRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4 },
  secureText: { color: colors.placeholderText2, fontSize: 11.5 },

  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.greyBorderLight2,
    padding: 22,
    paddingTop: 14,
    backgroundColor: colors.white,
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  footerSummary: { color: colors.placeholderText2, fontSize: 12 },
  footerPrice: { fontFamily: fonts.heading, fontSize: 22, color: colors.navyDeep },
});
