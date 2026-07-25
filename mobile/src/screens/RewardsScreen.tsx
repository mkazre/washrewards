import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { colors, font, radius, shadow } from '../theme';
import { Card, Loading, ErrorState, EmptyState } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../hooks/useAsync';
import * as api from '../api/endpoints';
import { Voucher } from '../api/types';
import { useToast } from '../components/Toast';
import { money, num, shortDate } from '../utils/format';

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { token } = useAuth();
  const [redeeming, setRedeeming] = useState<number | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const [vouchers, bookings] = await Promise.all([api.getVouchers(token!), api.getBookings(token!)]);
    return { vouchers, bookings };
  }, [token]);

  const active: Voucher[] = data?.vouchers.data.filter((v) => v.status === 'active') ?? [];
  const balance = active.reduce((s, v) => s + num(v.amount), 0);
  const progress = data?.vouchers.progress;
  const paidBookings = (data?.bookings ?? []).filter((b) => b.payment_status === 'paid').slice(0, 6);

  const redeem = async (v: Voucher) => {
    setRedeeming(v.id);
    try {
      await api.redeemVoucher(token!, v.id);
      toast(`Redeemed · ${money(v.amount)} voucher`);
      reload();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title}>Rewards</Text>
          <Text style={styles.label}>VOUCHER BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceValue}>{money(balance)}</Text>
            <Text style={styles.balanceReady}>{active.length ? 'ready' : ''}</Text>
          </View>
          <Text style={styles.headerSub}>
            {active.length} voucher{active.length === 1 ? '' : 's'} ready to redeem
            {progress ? ` · earn a ${money(progress.voucher_amount)} voucher every ${progress.threshold} paid washes.` : '.'}
          </Text>
        </View>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <View style={{ padding: 22 }}>
            {progress && (
              <>
                <Text style={styles.h3}>Your voucher progress</Text>
                <LinearGradient colors={[colors.navy2, colors.navy4]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.voucherCard}>
                  <View style={styles.glow} />
                  <View style={styles.rowBetween}>
                    <Text style={styles.washCount}>{progress.wash_count} of {progress.threshold} washes</Text>
                    <LinearGradient colors={[colors.amber, colors.amber2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
                      <Text style={styles.badgeText}>{money(progress.voucher_amount)} REWARD</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.dotsRow}>
                    {Array.from({ length: progress.threshold }).map((_, i) => (
                      <View key={i} style={[styles.dot, i < progress.wash_count ? null : styles.dotEmpty]}>
                        {i < progress.wash_count ? <LinearGradient colors={[colors.amber, colors.amber2]} style={StyleSheet.absoluteFill} /> : null}
                      </View>
                    ))}
                  </View>
                  <Text style={styles.voucherSub}>{progress.remaining} more paid wash{progress.remaining === 1 ? '' : 'es'} to unlock your next {money(progress.voucher_amount)} voucher.</Text>
                </LinearGradient>
              </>
            )}

            <Text style={[styles.h3, { marginTop: 24 }]}>Your vouchers</Text>
            {active.length === 0 ? (
              <Card style={{ padding: 20 }}>
                <EmptyState title="No vouchers yet" sub="Complete paid washes to earn vouchers you can redeem at any partner." />
              </Card>
            ) : (
              active.map((v) => (
                <Card key={v.id} style={styles.voucherItem}>
                  <LinearGradient colors={[colors.amber, colors.amber2]} style={styles.r100}>
                    <Text style={styles.r100Text}>{money(v.amount)}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.voucherItemTitle}>{money(v.amount)} Wash Voucher</Text>
                    <Text style={styles.voucherItemSub}>
                      {v.expires_at ? `Expires ${shortDate(v.expires_at)}` : 'No expiry'} · any partner
                    </Text>
                  </View>
                  <Pressable style={[styles.redeemBtn, redeeming === v.id && { opacity: 0.6 }]} onPress={() => redeem(v)} disabled={redeeming === v.id}>
                    {redeeming === v.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.redeemText}>Redeem</Text>}
                  </Pressable>
                </Card>
              ))
            )}

            <Text style={[styles.h3, { marginTop: 24, marginBottom: 6 }]}>Recent activity</Text>
            {paidBookings.length === 0 ? (
              <Card style={{ padding: 20 }}><EmptyState title="No activity yet" sub="Your bookings and rewards will appear here." /></Card>
            ) : (
              <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
                {paidBookings.map((b, i) => (
                  <View key={b.id} style={[styles.txnRow, i === paidBookings.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.txnIcon}><Feather name="truck" size={18} color="#5C6B7D" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txnTitle}>{b.service?.name ?? 'Wash'}</Text>
                      <Text style={styles.txnSub}>{b.tenant?.name ?? ''} · {shortDate(b.created_at)}</Text>
                    </View>
                    <Text style={styles.txnAmount}>{money(b.total_amount)}</Text>
                  </View>
                ))}
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 22, paddingBottom: 24 },
  title: { color: '#fff', fontFamily: font.display, fontSize: 20, marginBottom: 18 },
  label: { color: colors.onNavyMute, fontSize: 12, letterSpacing: 0.5, fontFamily: font.body },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  balanceValue: { color: '#fff', fontFamily: font.displayBold, fontSize: 40 },
  balanceReady: { color: colors.amber, fontFamily: font.display, fontSize: 14 },
  headerSub: { marginTop: 14, color: colors.onNavySoft, fontSize: 12.5, fontFamily: font.body },

  h3: { fontFamily: font.display, fontSize: 16, color: colors.ink, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voucherCard: { borderRadius: radius.lg, padding: 18, overflow: 'hidden', ...shadow.card },
  glow: { position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(245,158,11,0.16)' },
  washCount: { color: '#fff', fontFamily: font.display, fontSize: 14 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: colors.navy, fontFamily: font.displayBold, fontSize: 10.5, letterSpacing: 0.6 },
  dotsRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  dot: { flex: 1, height: 13, borderRadius: 999, overflow: 'hidden' },
  dotEmpty: { borderWidth: 1.5, borderColor: '#C9D2DE', borderStyle: 'dashed' },
  voucherSub: { marginTop: 11, color: colors.onNavySoft, fontSize: 12.5, fontFamily: font.body },

  voucherItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 12, borderColor: '#F4E3BE' },
  r100: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  r100Text: { color: colors.navy, fontFamily: font.displayBold, fontSize: 13 },
  voucherItemTitle: { fontFamily: font.display, fontSize: 14.5, color: colors.ink },
  voucherItemSub: { color: colors.inkSoft, fontSize: 12, marginTop: 2, fontFamily: font.body },
  redeemBtn: { backgroundColor: colors.blue, borderRadius: 11, paddingHorizontal: 15, paddingVertical: 9, minWidth: 74, alignItems: 'center' },
  redeemText: { color: '#fff', fontFamily: font.display, fontSize: 13 },

  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  txnIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#F1F4F9', alignItems: 'center', justifyContent: 'center' },
  txnTitle: { fontFamily: font.display, fontSize: 13.5, color: colors.ink },
  txnSub: { color: colors.inkFaint, fontSize: 11.5, marginTop: 2, fontFamily: font.body },
  txnAmount: { fontFamily: font.display, fontSize: 14, color: colors.ink },
});
