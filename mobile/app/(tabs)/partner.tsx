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
import {
  BarChart3,
  Building2,
  Check,
  Settings2,
  Star,
  Tag,
} from "lucide-react-native";
import { colors, fonts, gradients, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Booking } from "@/lib/api";
import { StatChip } from "@/components/StatChip";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";
import { PillButton } from "@/components/PillButton";

export default function PartnerScreen() {
  const { token, user, partnerDashboard, setPartnerDashboard } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  const hasTenant = !!user?.tenants?.length;
  const tenantName = user?.tenants?.[0]?.name ?? "Your business";
  const tenantArea = user?.tenants?.[0]?.area ?? "";

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const dashboard = await api.partner.dashboard(token);
      setPartnerDashboard(dashboard);
      try {
        const list = await api.partner.bookings(token);
        setBookings(list.slice(0, 6));
      } catch {
        setBookings(null);
      }
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Couldn't load your partner dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, setPartnerDashboard]);

  useEffect(() => {
    load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  async function advance(id: string | number) {
    if (!token) return;
    try {
      await api.partner.advanceBooking(token, id);
      load();
    } catch {
      // surfaced implicitly via the next refresh's error state
    }
  }

  if (!hasTenant) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.offWhite, padding: 22, justifyContent: "center" }}>
        <EmptyState
          title="No business linked to your account"
          message="Partner tools appear here once your account is linked to a car wash business."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.offWhite }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Building2 size={22} color={colors.mutedBlueGrey} strokeWidth={1.6} />
            </View>
            <View>
              <Text style={styles.tenantName}>{tenantName}</Text>
              <Text style={styles.tenantSub}>{tenantArea ? `${tenantArea} · Partner` : "Partner"}</Text>
            </View>
          </View>
          <View style={styles.businessTag}>
            <Text style={styles.businessTagText}>BUSINESS</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error && !partnerDashboard ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            <LinearGradient colors={gradients.panelCard} style={styles.revenueCard}>
              <View style={styles.revenueGlow} />
              <Text style={styles.revenueLabel}>NET SETTLED TO YOU</Text>
              <Text style={styles.revenueValue}>
                {partnerDashboard ? `R${partnerDashboard.revenue_this_month.toLocaleString()}` : "—"}
              </Text>
              <Text style={styles.revenueNote}>This month</Text>
            </LinearGradient>

            <View style={styles.statsGrid}>
              <StatChip
                label="Today's bookings"
                value={String(partnerDashboard?.today_bookings_count ?? "—")}
                delta={
                  partnerDashboard
                    ? `${partnerDashboard.today_bookings_upcoming} upcoming`
                    : undefined
                }
                deltaColor={colors.blue}
              />
              <StatChip
                label="Customers / month"
                value={String(partnerDashboard?.customers_this_month ?? "—")}
              />
              <StatChip
                label="Avg rating"
                value={partnerDashboard ? partnerDashboard.rating_avg.toFixed(1) : "—"}
                delta={partnerDashboard ? `${partnerDashboard.rating_count} reviews` : undefined}
                deltaColor={colors.greyText2}
              />
            </View>

            <Text style={styles.sectionTitle}>Today's bookings</Text>
            <View style={styles.bookingsCard}>
              {bookings && bookings.length > 0 ? (
                bookings.map((b, i) => (
                  <View
                    key={b.id}
                    style={[
                      styles.bookingRow,
                      i === bookings.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.timeChip}>
                      <Text style={styles.timeChipText}>
                        {new Date(b.scheduled_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingName}>{b.service?.name ?? "Booking"}</Text>
                      <Text style={styles.bookingSub}>{b.status}</Text>
                    </View>
                    {b.status === "completed" ? (
                      <View style={styles.doneTag}>
                        <Check size={12} color={colors.green} strokeWidth={3} />
                        <Text style={styles.doneTagText}>Done</Text>
                      </View>
                    ) : (
                      <Pressable style={styles.advanceBtn} onPress={() => advance(b.id)}>
                        <Text style={styles.advanceBtnText}>Advance</Text>
                      </Pressable>
                    )}
                  </View>
                ))
              ) : (
                <View style={{ padding: 16 }}>
                  <EmptyState title="No bookings yet today" message="New bookings will appear here." />
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Recent reviews</Text>
            <View style={styles.reviewCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.reviewAvg}>
                  {partnerDashboard ? partnerDashboard.rating_avg.toFixed(1) : "—"}
                </Text>
                <View style={{ flexDirection: "row", gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} color={colors.gold} fill={colors.gold} />
                  ))}
                </View>
                <Text style={styles.reviewCount}>
                  {partnerDashboard ? `${partnerDashboard.rating_count} reviews` : ""}
                </Text>
              </View>
            </View>

            <View style={styles.actionsGrid}>
              <Pressable style={styles.actionBtn}>
                <Settings2 size={20} color={colors.blue} strokeWidth={1.8} />
                <Text style={styles.actionBtnText}>Manage services</Text>
              </Pressable>
              <Pressable style={styles.actionBtn}>
                <Tag size={20} color={colors.gold} strokeWidth={1.8} />
                <Text style={styles.actionBtnText}>Promotions</Text>
              </Pressable>
            </View>

            <View style={{ marginTop: 14 }}>
              <PillButton
                label="View Analytics"
                variant="dark"
                icon={<BarChart3 size={19} color={colors.gold} strokeWidth={1.9} />}
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, padding: 22, paddingTop: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  tenantName: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 17 },
  tenantSub: { color: colors.mutedBlueGrey2, fontSize: 12.5 },
  businessTag: { backgroundColor: "rgba(245,158,11,0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  businessTagText: { color: colors.gold, fontFamily: fonts.headingSemi, fontSize: 10.5, letterSpacing: 0.5 },

  body: { padding: 22 },
  sectionTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.navyDeep, marginTop: 24, marginBottom: 12 },

  revenueCard: { borderRadius: radii.xxl, padding: 20, overflow: "hidden", ...shadow.cardLift },
  revenueGlow: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(245,158,11,0.22)",
  },
  revenueLabel: { color: colors.mutedBlueGrey, fontSize: 12, letterSpacing: 0.6 },
  revenueValue: { color: colors.white, fontFamily: fonts.heading, fontSize: 32, marginTop: 4 },
  revenueNote: { color: "#C6D2E8", fontSize: 12.5, marginTop: 6 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },

  bookingsCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.greyBorderLight, borderRadius: radii.xl, ...shadow.card },
  bookingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderBottomWidth: 1, borderBottomColor: colors.divider },
  timeChip: { backgroundColor: colors.chipBlueBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  timeChipText: { color: colors.blue, fontFamily: fonts.headingSemi, fontSize: 13 },
  bookingName: { fontFamily: fonts.headingSemi, fontSize: 13.5, color: colors.navyDeep },
  bookingSub: { color: colors.placeholderText2, fontSize: 11.5, marginTop: 2 },
  doneTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.greenBg, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7 },
  doneTagText: { color: colors.green, fontSize: 12, fontFamily: fonts.headingSemi },
  advanceBtn: { backgroundColor: colors.chipBlueBg, borderWidth: 1, borderColor: colors.chipBlueBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  advanceBtnText: { color: colors.blue, fontSize: 12.5, fontFamily: fonts.headingSemi },

  reviewCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.greyBorderLight, borderRadius: radii.xl, padding: 16, ...shadow.card },
  reviewAvg: { fontFamily: fonts.heading, fontSize: 24, color: colors.navyDeep },
  reviewCount: { marginLeft: "auto", color: colors.placeholderText2, fontSize: 12 },

  actionsGrid: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorder,
    borderRadius: radii.lg,
    padding: 15,
    gap: 8,
    ...shadow.card,
  },
  actionBtnText: { fontFamily: fonts.headingSemi, fontSize: 13.5, color: colors.navyDeep },
});
