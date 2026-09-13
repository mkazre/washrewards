import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import { TrendingUp } from "lucide-react-native";
import { colors, fonts, gradients, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError } from "@/lib/api";
import { StatChip } from "@/components/StatChip";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";

const COMMISSION_RATE = 0.3;
const RUNNING_COST_RATE = 0.35;

function fmtR(n: number) {
  return `R${Math.round(n).toLocaleString()}`;
}

export default function PlatformScreen() {
  const { token, user, platformDashboard, setPlatformDashboard } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [projPartners, setProjPartners] = useState(60);
  const [projBookings, setProjBookings] = useState(180);
  const [projAov, setProjAov] = useState(150);

  const isAdmin = !!user?.is_admin;

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const dashboard = await api.platform.dashboard(token);
      setPlatformDashboard(dashboard);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Couldn't load the platform console."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, setPlatformDashboard]);

  useEffect(() => {
    load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.offWhite, padding: 22, justifyContent: "center" }}>
        <EmptyState
          title="Owner access required"
          message="The Platform console is only available to WashRewards SA owner accounts."
        />
      </View>
    );
  }

  const grossMo = projPartners * projBookings * projAov;
  const commMo = grossMo * COMMISSION_RATE;
  const commYr = commMo * 12;
  const netYr = commYr * (1 - RUNNING_COST_RATE);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.offWhite }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Platform</Text>
            <Text style={styles.headerSub}>WashRewards SA · Owner console</Text>
          </View>
          <View style={styles.ownerTag}>
            <Text style={styles.ownerTagText}>OWNER</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error && !platformDashboard ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <>
            <LinearGradient colors={gradients.panelCard} style={styles.commCard}>
              <View style={styles.commGlow} />
              <Text style={styles.commLabel}>COMMISSION EARNED · THIS MONTH</Text>
              <Text style={styles.commValue}>
                {platformDashboard ? fmtR(platformDashboard.commission_this_month) : "—"}
              </Text>
              <Text style={styles.commNote}>
                30% of {platformDashboard ? fmtR(platformDashboard.gross_bookings_this_month) : "—"} gross
              </Text>
            </LinearGradient>

            <View style={styles.statsGrid}>
              <StatChip
                label="Active partners"
                value={String(platformDashboard?.active_partners ?? "—")}
              />
              <StatChip
                label="Bookings / month"
                value={String(platformDashboard?.bookings_per_month ?? "—")}
                deltaColor={colors.blue}
              />
              <StatChip
                label="Gross bookings"
                value={platformDashboard ? fmtR(platformDashboard.gross_bookings_this_month) : "—"}
              />
              <StatChip
                label="Avg / partner"
                value={platformDashboard ? fmtR(platformDashboard.avg_commission_per_partner) : "—"}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Revenue projection</Text>
        <Text style={styles.sectionSub}>
          Model network revenue at 30% commission — drag to explore.
        </Text>

        <View style={styles.sliderCard}>
          <SliderRow
            label="Partners"
            value={projPartners}
            display={String(projPartners)}
            min={5}
            max={300}
            step={5}
            onChange={setProjPartners}
          />
          <SliderRow
            label="Bookings / partner / month"
            value={projBookings}
            display={String(projBookings)}
            min={30}
            max={800}
            step={10}
            onChange={setProjBookings}
          />
          <SliderRow
            label="Avg wash price"
            value={projAov}
            display={`R${projAov}`}
            min={60}
            max={350}
            step={10}
            onChange={setProjAov}
          />
        </View>

        <LinearGradient colors={gradients.panelCard} style={styles.resultCard}>
          <View style={styles.commGlow} />
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Gross bookings / mo</Text>
            <Text style={styles.resultValue}>{fmtR(grossMo)}</Text>
          </View>
          <View style={[styles.resultRow, { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", paddingBottom: 12 }]}>
            <Text style={styles.resultLabel}>Commission (30%) / mo</Text>
            <Text style={styles.resultValueGold}>{fmtR(commMo)}</Text>
          </View>
          <Text style={styles.resultBigLabel}>COMMISSION / YEAR</Text>
          <Text style={styles.resultBigValue}>{fmtR(commYr)}</Text>
          <View style={styles.netRow}>
            <TrendingUp size={16} color={colors.green2} strokeWidth={2} />
            <Text style={styles.netText}>
              Est. net profit / year{" "}
              <Text style={{ color: colors.white, fontFamily: fonts.headingSemi }}>
                {fmtR(netYr)}
              </Text>{" "}
              after ~35% running costs
            </Text>
          </View>
        </LinearGradient>
        <Text style={styles.disclaimer}>
          Illustrative model · actual results depend on partner activity and
          take-rate.
        </Text>
      </View>
    </ScrollView>
  );
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ marginBottom: 6 }}>
      <View style={styles.sliderHeaderRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{display}</Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={colors.blue}
        maximumTrackTintColor={colors.greyBorderLight2}
        thumbTintColor={colors.blue}
        style={{ marginTop: 6 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, padding: 22, paddingTop: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 20 },
  headerSub: { color: colors.mutedBlueGrey2, fontSize: 12.5, marginTop: 2 },
  ownerTag: { backgroundColor: "rgba(245,158,11,0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  ownerTagText: { color: colors.gold, fontFamily: fonts.headingSemi, fontSize: 10.5, letterSpacing: 0.5 },

  body: { padding: 22 },
  sectionTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.navyDeep, marginTop: 24, marginBottom: 4 },
  sectionSub: { color: colors.greyText, fontSize: 12.5, lineHeight: 18, marginBottom: 14 },

  commCard: { borderRadius: radii.xxl, padding: 20, overflow: "hidden", ...shadow.cardLift },
  commGlow: {
    position: "absolute",
    top: -46,
    right: -34,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(245,158,11,0.28)",
  },
  commLabel: { color: colors.mutedBlueGrey, fontSize: 12, letterSpacing: 0.6 },
  commValue: { color: colors.white, fontFamily: fonts.heading, fontSize: 38, marginTop: 4 },
  commNote: { color: "#C6D2E8", fontSize: 12.5, marginTop: 6 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },

  sliderCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    padding: 18,
    ...shadow.card,
  },
  sliderHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 },
  sliderLabel: { fontFamily: fonts.headingSemi, fontSize: 13.5, color: colors.navyDeep },
  sliderValue: { fontFamily: fonts.heading, fontSize: 15, color: colors.blue },

  resultCard: { borderRadius: radii.xl, padding: 18, marginTop: 12, overflow: "hidden", ...shadow.cardLift },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  resultLabel: { color: colors.mutedBlueGrey, fontSize: 12.5 },
  resultValue: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 15 },
  resultValueGold: { color: colors.gold, fontFamily: fonts.heading, fontSize: 16 },
  resultBigLabel: { marginTop: 14, color: colors.mutedBlueGrey, fontSize: 12, letterSpacing: 0.6 },
  resultBigValue: { color: colors.white, fontFamily: fonts.heading, fontSize: 32, marginTop: 3 },
  netRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
  },
  netText: { color: "#C6D2E8", fontSize: 12, lineHeight: 17, flex: 1 },
  disclaimer: { textAlign: "center", color: colors.placeholderText, fontSize: 11, marginTop: 12, lineHeight: 16 },
});
