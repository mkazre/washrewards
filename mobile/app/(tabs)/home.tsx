import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Bell, Car, MapPin, ChevronRight, Star, Award } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, gradients, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Booking, Tenant, Vehicle } from "@/lib/api";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";
import { NearbyMap } from "@/components/NearbyMap";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, config, tenants, setTenants, loyalty, setLoyalty, setBookingDraft } =
    useAppState();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [unratedBooking, setUnratedBooking] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tenantList, vehicles] = await Promise.all([
        api.tenants.list(token),
        token ? api.vehicles.list(token) : Promise.resolve([]),
      ]);
      setTenants(tenantList);
      setVehicle(vehicles[0] ?? null);
      if (token) {
        try {
          const summary = await api.loyalty.summary(token);
          setLoyalty(summary);
        } catch {
          // loyalty summary is secondary — home still renders without it
        }
        try {
          const bookings = await api.bookings.list(token);
          const toRate = bookings.find(
            (b) => b.status === "completed" && b.has_review === false
          );
          setUnratedBooking(toRate ?? null);
        } catch {
          setUnratedBooking(null);
        }
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load nearby car washes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, setTenants, setLoyalty]);

  useEffect(() => {
    load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function openBooking(tenant: Tenant) {
    setBookingDraft({ tenant });
    router.push("/booking");
  }

  function openRating(b: Booking) {
    setBookingDraft({
      tenant: b.tenant,
      packageName: b.service?.name,
      bookingId: b.id,
      receiptNo: b.receipt_no,
    });
    router.push("/rating");
  }

  const washCount = loyalty?.month_washes ?? 0;
  const washTarget = 6;
  const washRemaining = Math.max(0, washTarget - (washCount % washTarget || washTarget));
  const voucherBalance = loyalty?.wallet?.length ?? 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.offWhite }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
    >
      <View style={[styles.headerWrap, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={gradients.blueButton} style={styles.avatar}>
              <Text style={styles.avatarLabel}>
                {(user?.name ?? "WR").split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </Text>
            </LinearGradient>
            <View>
              <Text style={styles.welcome}>Welcome back</Text>
              <Text style={styles.userName}>{user?.name ?? "Guest"}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/notifications")} style={styles.bellBtn}>
            <Bell size={21} color={colors.white} strokeWidth={1.7} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        {vehicle ? (
          <View style={styles.vehicleChip}>
            <Car size={17} color={colors.mutedBlueGrey} strokeWidth={1.7} />
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
            <View style={styles.dotSep} />
            <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.heroWrap}>
        <LinearGradient colors={gradients.heroCard} style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroBrand}>
              <LinearGradient colors={gradients.goldButton} style={styles.heroBrandDot} />
              <Text style={styles.heroBrandText}>WashRewards</Text>
            </View>
            <LinearGradient colors={gradients.goldButton} style={styles.heroLevelPill}>
              <Text style={styles.heroLevelText}>
                {loyalty?.tier?.name ?? "BRONZE"} · LVL {loyalty?.tier?.level ?? 1}
              </Text>
            </LinearGradient>
          </View>

          <Text style={styles.heroLabel}>VOUCHER BALANCE</Text>
          <View style={styles.heroBalanceRow}>
            <Text style={styles.heroBalance}>{voucherBalance}</Text>
            <Text style={styles.heroBalanceUnit}>ready</Text>
          </View>

          <View style={styles.heroBottomRow}>
            <Text style={styles.heroCardNumber}>•••• {String(user?.id ?? "0000").padStart(4, "0").slice(-4)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <LinearGradient colors={gradients.goldButton} style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>R</Text>
              </LinearGradient>
              <Text style={styles.progressTitle}>R100 voucher progress</Text>
            </View>
            <Text style={styles.progressCount}>{washCount % washTarget || (washCount ? washTarget : 0)}/{washTarget}</Text>
          </View>
          <View style={styles.dotsRow}>
            {Array.from({ length: washTarget }).map((_, i) => {
              const filled = i < (washCount % washTarget || (washCount ? washTarget : 0));
              return (
                <View
                  key={i}
                  style={[styles.dot, filled ? styles.dotFilled : styles.dotEmpty]}
                />
              );
            })}
          </View>
          <Text style={styles.progressNote}>
            {washRemaining} more washes to earn a R100 voucher — redeemable at
            any partner.
          </Text>
        </View>

        {unratedBooking ? (
          <Pressable style={styles.ratePrompt} onPress={() => openRating(unratedBooking)}>
            <View style={styles.rateIconWrap}>
              <Star size={20} color={colors.gold} fill={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateTitle}>Rate your recent wash</Text>
              <Text style={styles.rateSub}>
                {unratedBooking.tenant?.name ?? "Tell us how your last visit went"}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.mutedBlueGrey3} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.listWrap}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Nearby car washes</Text>
          <View style={styles.toggle}>
            <Pressable
              onPress={() => setView("list")}
              style={[styles.toggleBtn, view === "list" && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, view === "list" && styles.toggleTextActive]}>
                List
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setView("map")}
              style={[styles.toggleBtn, view === "map" && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, view === "map" && styles.toggleTextActive]}>
                Map
              </Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : view === "map" ? (
          config?.maps ? (
            <NearbyMap maps={config.maps} tenants={tenants ?? []} onSelectTenant={openBooking} />
          ) : (
            <View style={styles.mapPlaceholder}>
              <MapPin size={26} color={colors.blue} />
              <Text style={styles.mapPlaceholderText}>
                Map view · {tenants?.length ?? 0} car washes nearby
              </Text>
            </View>
          )
        ) : !tenants || tenants.length === 0 ? (
          <EmptyState
            title="No car washes found nearby"
            message="Try again shortly, or check your connection."
          />
        ) : (
          tenants.map((t) => (
            <Pressable key={t.id} style={styles.tenantRow} onPress={() => openBooking(t)}>
              <View style={styles.tenantPhoto}>
                <Car size={22} color={colors.greyText2} strokeWidth={1.6} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.tenantName} numberOfLines={1}>
                  {t.name}
                </Text>
                <View style={styles.tenantAreaRow}>
                  <MapPin size={12} color={colors.placeholderText} strokeWidth={1.8} />
                  <Text style={styles.tenantArea}>{t.suburb ?? t.city ?? "—"}</Text>
                </View>
                <View style={styles.tenantMetaRow}>
                  <View style={styles.tenantRating}>
                    <Star size={13} color={colors.gold} fill={colors.gold} />
                    <Text style={styles.tenantRatingText}>{t.rating_avg?.toFixed(1) ?? "—"}</Text>
                  </View>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.tenantMeta}>
                    {t.distance_km ? `${t.distance_km.toFixed(1)} km` : "—"}
                  </Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.tenantMeta}>
                    from {t.from_price ? `R${t.from_price}` : "—"}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#C2CAD4" strokeWidth={2} />
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerWrap: { backgroundColor: colors.navy, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 96 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarLabel: { color: colors.white, fontFamily: fonts.heading, fontSize: 17 },
  welcome: { color: colors.mutedBlueGrey2, fontSize: 12.5 },
  userName: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 16 },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.navy,
  },
  vehicleChip: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 9,
    alignSelf: "flex-start",
  },
  vehicleName: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 13 },
  dotSep: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.mutedBlueGrey2 },
  vehiclePlate: { color: colors.mutedBlueGrey, fontSize: 12.5 },

  heroWrap: { paddingHorizontal: 22, marginTop: -80 },
  heroCard: { borderRadius: radii.round, padding: 22, overflow: "hidden", ...shadow.panel },
  heroGlow: {
    position: "absolute",
    top: -46,
    right: -34,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(245,158,11,0.28)",
  },
  heroTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroBrand: { flexDirection: "row", alignItems: "center", gap: 9 },
  heroBrandDot: { width: 26, height: 26, borderRadius: 8 },
  heroBrandText: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 14 },
  heroLevelPill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  heroLevelText: { color: colors.navy, fontFamily: fonts.heading, fontSize: 10.5, letterSpacing: 1 },
  heroLabel: { marginTop: 24, color: colors.mutedBlueGrey, fontSize: 12, letterSpacing: 1 },
  heroBalanceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 2 },
  heroBalance: { color: colors.white, fontFamily: fonts.heading, fontSize: 46 },
  heroBalanceUnit: { color: colors.gold, fontFamily: fonts.headingSemi, fontSize: 15 },
  heroBottomRow: { marginTop: 22, flexDirection: "row", justifyContent: "space-between" },
  heroCardNumber: { color: "#C6D2E8", fontFamily: fonts.headingMed, fontSize: 15, letterSpacing: 2 },

  progressCard: {
    marginTop: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    borderRadius: radii.xl,
    padding: 16,
    ...shadow.card,
  },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  progressBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  progressBadgeText: { color: colors.navy, fontFamily: fonts.heading, fontSize: 11 },
  progressTitle: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.navyDeep },
  progressCount: { fontFamily: fonts.heading, fontSize: 13, color: colors.amberText2 },
  dotsRow: { flexDirection: "row", gap: 9, marginTop: 14, alignItems: "center" },
  dot: { flex: 1, height: 13, borderRadius: 999 },
  dotFilled: { backgroundColor: colors.gold },
  dotEmpty: { backgroundColor: colors.greyBg3 },
  progressNote: { marginTop: 11, color: colors.greyText, fontSize: 12 },

  ratePrompt: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: 14,
  },
  rateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  rateTitle: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 13.5 },
  rateSub: { color: colors.mutedBlueGrey, fontSize: 12, marginTop: 2 },

  listWrap: { paddingHorizontal: 22, paddingTop: 24 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontFamily: fonts.headingSemi, fontSize: 17, color: colors.navyDeep },
  toggle: { flexDirection: "row", backgroundColor: colors.greyBg3, borderRadius: 11, padding: 3, gap: 2 },
  toggleBtn: { borderRadius: 9, paddingVertical: 6, paddingHorizontal: 13 },
  toggleBtnActive: { backgroundColor: colors.white, ...shadow.card },
  toggleText: { fontSize: 12.5, fontFamily: fonts.headingSemi, color: colors.greyText },
  toggleTextActive: { color: colors.navyDeep },

  mapPlaceholder: {
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E3E8EF",
    backgroundColor: "#E9EEF4",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapPlaceholderText: { color: colors.greyText3, fontFamily: fonts.headingMed, fontSize: 12.5 },

  tenantRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    padding: 12,
    marginBottom: 12,
    ...shadow.card,
  },
  tenantPhoto: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: colors.greyBg3,
    alignItems: "center",
    justifyContent: "center",
  },
  tenantName: { fontFamily: fonts.headingSemi, fontSize: 15, color: colors.navyDeep },
  tenantAreaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  tenantArea: { color: colors.greyText, fontSize: 12.5 },
  tenantMetaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 },
  tenantRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  tenantRatingText: { color: colors.navyDeep, fontFamily: fonts.headingSemi, fontSize: 12.5 },
  metaDot: { color: "#D2D8E0" },
  tenantMeta: { color: colors.greyText, fontSize: 12.5 },
});
