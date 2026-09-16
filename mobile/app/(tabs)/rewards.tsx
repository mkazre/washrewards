import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { Check, Gift, Lock, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, gradients, radii, shadow } from "@/lib/theme";
import { useAppState } from "@/lib/AppState";
import { api, ApiError, Booking, WalletVoucher } from "@/lib/api";
import { SkeletonCard } from "@/components/Skeleton";
import { ErrorState, EmptyState } from "@/components/ErrorState";
import { VoucherCard } from "@/components/VoucherCard";
import { AppLogo } from "@/components/AppLogo";

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { token, loyalty, setLoyalty } = useAppState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activity, setActivity] = useState<Booking[] | null>(null);
  const [activeVoucher, setActiveVoucher] = useState<WalletVoucher | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const summary = await api.loyalty.summary(token);
      setLoyalty(summary);
      try {
        const bookings = await api.bookings.list(token);
        setActivity(bookings.slice(0, 6));
      } catch {
        setActivity(null);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load your rewards.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, setLoyalty]);

  useEffect(() => {
    load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  if (loading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.offWhite }}
        contentContainerStyle={{ padding: 22, paddingTop: insets.top + 22 }}
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  if (error && !loyalty) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.offWhite, padding: 22, justifyContent: "center" }}>
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  const washCount = loyalty?.month_washes ?? 0;
  const washTarget = 6;
  const inCycle = washCount % washTarget || (washCount ? washTarget : 0);
  const washRemaining = Math.max(0, washTarget - inCycle);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.offWhite }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.blue} />}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AppLogo size={28} />
              <Text style={styles.headerTitle}>Rewards</Text>
            </View>
            <LinearGradient colors={gradients.goldButton} style={styles.levelPill}>
              <Text style={styles.levelPillText}>
                {loyalty?.tier?.name ?? "BRONZE"} · LEVEL {loyalty?.tier?.level ?? 1}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.washRow}>
            <Text style={styles.washLabel}>WASHES · LAST 3 MONTHS</Text>
            <Text style={styles.washValue}>
              {washCount} of {loyalty?.next_threshold ?? 18}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.trackFill,
                { width: `${Math.min(100, loyalty?.level_pct ?? 0)}%` },
              ]}
            />
          </View>
          <Text style={styles.washNote}>
            {loyalty
              ? `${washRemaining} more washes to reach your next level.`
              : "Complete washes to progress through reward levels."}
          </Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>This month's reward</Text>
          <LinearGradient colors={gradients.panelCard} style={styles.rewardCard}>
            <View style={styles.rewardGlow} />
            <View style={styles.rewardRow}>
              <LinearGradient colors={gradients.goldButton} style={styles.rewardIcon}>
                <Gift size={24} color={colors.navy} strokeWidth={1.8} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardTitle}>
                  {loyalty?.tier?.reward_description ?? "R100 voucher"}
                </Text>
                <Text style={styles.rewardSub}>
                  Unlocked at {loyalty?.tier?.name ?? "your level"}
                </Text>
              </View>
            </View>
            <Text style={styles.rewardNote}>
              Vouchers are issued automatically once you complete enough
              paid washes — no need to claim them.
            </Text>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Your vouchers</Text>
          {loyalty?.wallet && loyalty.wallet.length > 0 ? (
            loyalty.wallet.map((v) => (
              <VoucherCard key={v.id} voucher={v} onShowCode={() => setActiveVoucher(v)} />
            ))
          ) : (
            <EmptyState
              title="No active vouchers yet"
              message="Complete 6 washes to earn a R100 voucher."
            />
          )}

          <Text style={styles.sectionTitle}>R100 voucher progress</Text>
          <LinearGradient colors={gradients.panelCard} style={styles.progressPanel}>
            <View style={styles.rewardGlow} />
            <View style={styles.progressPanelRow}>
              <Text style={styles.progressPanelText}>{inCycle} of {washTarget} washes</Text>
              <LinearGradient colors={gradients.goldButton} style={styles.rewardTag}>
                <Text style={styles.rewardTagText}>R100 REWARD</Text>
              </LinearGradient>
            </View>
            <View style={styles.dotsRow}>
              {Array.from({ length: washTarget }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i < inCycle ? styles.dotFilled : styles.dotEmpty]}
                />
              ))}
            </View>
            <Text style={styles.progressPanelNote}>
              {washRemaining} more paid washes to unlock your next R100 voucher.
            </Text>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Reward levels</Text>
          {(loyalty?.level_rows ?? []).map((lv) => (
            <View
              key={lv.level}
              style={[styles.levelRow, lv.current && styles.levelRowCurrent]}
            >
              <View style={[styles.levelBadge, lv.current && styles.levelBadgeCurrent]}>
                <Text
                  style={[
                    styles.levelBadgeText,
                    lv.current && { color: colors.white },
                  ]}
                >
                  {lv.level}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.levelName}>{lv.name}</Text>
                  {lv.current ? (
                    <View style={styles.youTag}>
                      <Text style={styles.youTagText}>YOU</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.levelReward}>{lv.reward_description}</Text>
              </View>
              {lv.achieved ? (
                <Check size={20} color={colors.green} strokeWidth={2.4} />
              ) : (
                <Lock size={17} color="#C2CAD4" strokeWidth={1.9} />
              )}
            </View>
          ))}
          {!loyalty?.level_rows?.length && (
            <EmptyState title="Levels coming soon" message="Reward levels will appear once loaded." />
          )}

          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.activityCard}>
            {activity && activity.length > 0 ? (
              activity.map((b, i) => (
                <View
                  key={b.id}
                  style={[
                    styles.activityRow,
                    i === activity.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.activityIcon}>
                    <Gift size={18} color={colors.greyText3} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle}>
                      {b.service?.name ?? "Wash"} · {b.tenant?.name ?? "Partner"}
                    </Text>
                    <Text style={styles.activitySub}>{b.status}</Text>
                  </View>
                  <Text style={styles.activityAmount}>
                    {b.price ? `R${b.price}` : ""}
                  </Text>
                </View>
              ))
            ) : (
              <View style={{ padding: 16 }}>
                <EmptyState title="No activity yet" message="Your bookings will show up here." />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={!!activeVoucher}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveVoucher(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>
                  {activeVoucher ? `R${activeVoucher.amount} Wash Voucher` : ""}
                </Text>
                <Text style={styles.modalSub}>Scan at the wash to redeem</Text>
              </View>
              <Pressable onPress={() => setActiveVoucher(null)} style={styles.modalClose}>
                <X size={17} color={colors.greyText3} strokeWidth={2.2} />
              </Pressable>
            </View>
            <View style={styles.qrWrap}>
              {activeVoucher?.qr_token ? (
                <QRCode value={activeVoucher.qr_token} size={168} />
              ) : null}
            </View>
            <Text style={styles.qrValue}>
              Value <Text style={{ fontFamily: fonts.headingSemi, color: colors.navyDeep }}>R{activeVoucher?.amount}</Text>
              {activeVoucher?.expires_at ? (
                <>
                  {" · expires "}
                  {new Date(activeVoucher.expires_at).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              ) : null}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, padding: 22, paddingTop: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 20 },
  levelPill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  levelPillText: { color: colors.navy, fontFamily: fonts.heading, fontSize: 10.5, letterSpacing: 1 },
  washRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 16 },
  washLabel: { color: colors.mutedBlueGrey, fontSize: 12, letterSpacing: 0.5 },
  washValue: { color: "#C6D2E8", fontSize: 12.5 },
  track: { marginTop: 8, height: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  trackFill: { height: "100%", borderRadius: 999, backgroundColor: colors.gold },
  washNote: { marginTop: 9, color: "#C6D2E8", fontSize: 12.5 },

  body: { padding: 22 },
  sectionTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: colors.navyDeep, marginTop: 24, marginBottom: 12 },

  rewardCard: { borderRadius: radii.xl, padding: 18, overflow: "hidden", ...shadow.cardLift },
  rewardGlow: {
    position: "absolute",
    top: -46,
    right: -34,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(245,158,11,0.28)",
  },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  rewardIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rewardTitle: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 16 },
  rewardSub: { color: colors.mutedBlueGrey, fontSize: 12.5, marginTop: 3 },
  rewardNote: { marginTop: 14, color: "#C6D2E8", fontSize: 12, lineHeight: 17 },

  progressPanel: { borderRadius: radii.xl, padding: 18, overflow: "hidden", ...shadow.cardLift },
  progressPanelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressPanelText: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 14 },
  rewardTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  rewardTagText: { color: colors.navy, fontFamily: fonts.heading, fontSize: 10.5 },
  dotsRow: { flexDirection: "row", gap: 9, marginTop: 14, alignItems: "center" },
  dot: { flex: 1, height: 13, borderRadius: 999 },
  dotFilled: { backgroundColor: colors.gold },
  dotEmpty: { backgroundColor: "rgba(255,255,255,0.14)" },
  progressPanelNote: { marginTop: 11, color: "#C6D2E8", fontSize: 12.5 },

  levelRow: {
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
    borderRadius: radii.lg,
    padding: 13,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
  },
  levelRowCurrent: { backgroundColor: colors.chipBlueBg, borderColor: colors.chipBlueBorder },
  levelBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.greyBg3,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBadgeCurrent: { backgroundColor: colors.blue },
  levelBadgeText: { fontFamily: fonts.heading, fontSize: 14, color: colors.navyDeep },
  levelName: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.navyDeep },
  levelReward: { color: colors.greyText, fontSize: 12.5, marginTop: 2 },
  youTag: { backgroundColor: colors.blue, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  youTagText: { color: colors.white, fontFamily: fonts.headingSemi, fontSize: 9.5, letterSpacing: 0.5 },

  activityCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    ...shadow.card,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#F1F4F9",
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: { fontFamily: fonts.headingSemi, fontSize: 13.5, color: colors.navyDeep },
  activitySub: { color: colors.placeholderText2, fontSize: 11.5, marginTop: 2 },
  activityAmount: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.navyDeep },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(9,24,48,0.55)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 32,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E1E5EC", alignSelf: "center", marginBottom: 16 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.navyDeep },
  modalSub: { color: colors.greyText, fontSize: 12.5, marginTop: 2 },
  modalClose: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#F1F3F6", alignItems: "center", justifyContent: "center" },
  qrWrap: { marginTop: 18, alignItems: "center", padding: 16, borderWidth: 1, borderColor: colors.greyBorderLight, borderRadius: 20, alignSelf: "center" },
  qrValue: { textAlign: "center", marginTop: 12, color: colors.placeholderText, fontSize: 12.5 },
});
