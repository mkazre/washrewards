import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { colors, font, radius, shadow } from '../theme';
import { Card, Stars, Loading, ErrorState, EmptyState } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../hooks/useAsync';
import * as api from '../api/endpoints';
import { Booking } from '../api/types';
import { useToast } from '../components/Toast';
import { money, timeOf } from '../utils/format';

const ACTION_FOR: Record<string, string | null> = {
  pending: 'Check in', confirmed: 'Check in', checked_in: 'Mark done',
  in_progress: 'Mark done', completed: null, cancelled: null,
};

export default function PartnerScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { token, user, isPartner } = useAuth();
  const [advancing, setAdvancing] = useState<number | null>(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const [dashboard, bookings] = await Promise.all([api.getPartnerDashboard(token!), api.getPartnerBookings(token!)]);
    return { dashboard, bookings };
  }, [token], );

  if (!isPartner) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.bizName}>Partner</Text>
        </View>
        <View style={{ padding: 22 }}>
          <Card style={{ padding: 24 }}>
            <EmptyState title="No business linked" sub="This account isn't set up as a car-wash partner yet. Partner access is granted from the admin panel." />
          </Card>
        </View>
      </View>
    );
  }

  const bizName = user?.tenants?.[0]?.name ?? 'Your business';
  const d = data?.dashboard;
  const bookings = data?.bookings ?? [];

  const advance = async (b: Booking) => {
    setAdvancing(b.id);
    try { await api.advancePartnerBooking(token!, b.id); reload(); }
    catch (e) { toast((e as Error).message); }
    finally { setAdvancing(null); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <LinearGradient colors={[colors.navy3, colors.navy4]} style={styles.logo}>
                <Feather name="briefcase" size={16} color={colors.onNavyMute} />
              </LinearGradient>
              <View>
                <Text style={styles.bizName}>{bizName}</Text>
                <Text style={styles.bizSub}>Partner dashboard</Text>
              </View>
            </View>
            <View style={styles.bizBadge}><Text style={styles.bizBadgeText}>BUSINESS</Text></View>
          </View>
        </View>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <View style={{ padding: 22 }}>
            <LinearGradient colors={[colors.navy2, colors.navy4]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.revenueCard}>
              <View style={styles.glow} />
              <Text style={styles.revLabel}>REVENUE THIS MONTH</Text>
              <Text style={styles.revValue}>{money(d?.revenue_this_month ?? 0)}</Text>
              <Text style={styles.revSub}>Settled partner earnings</Text>
            </LinearGradient>

            <View style={styles.grid}>
              <Card style={styles.stat}>
                <Text style={styles.statLabel}>Today's bookings</Text>
                <Text style={styles.statValue}>{d?.today_bookings_count ?? 0}</Text>
                <Text style={[styles.statDelta, { color: colors.blue }]}>{d?.today_bookings_upcoming ?? 0} upcoming</Text>
              </Card>
              <Card style={styles.stat}>
                <Text style={styles.statLabel}>Customers / month</Text>
                <Text style={styles.statValue}>{d?.customers_this_month ?? 0}</Text>
                <Text style={[styles.statDelta, { color: '#16A34A' }]}>this month</Text>
              </Card>
              <Card style={styles.stat}>
                <Text style={styles.statLabel}>Reviews</Text>
                <Text style={styles.statValue}>{d?.rating_count ?? 0}</Text>
                <Text style={[styles.statDelta, { color: colors.blue }]}>verified</Text>
              </Card>
              <Card style={styles.stat}>
                <Text style={styles.statLabel}>Avg rating</Text>
                <View style={[styles.row, { gap: 5, marginTop: 4 }]}>
                  <Text style={styles.statValue}>{(d?.rating_avg ?? 0).toFixed(1)}</Text>
                  <Stars value={1} size={17} gap={0} />
                </View>
                <Text style={[styles.statDelta, { color: '#16A34A' }]}>out of 5</Text>
              </Card>
            </View>

            <Text style={[styles.h3, { marginTop: 24 }]}>Bookings</Text>
            {bookings.length === 0 ? (
              <Card style={{ padding: 20 }}><EmptyState title="No bookings yet" sub="New customer bookings will appear here." /></Card>
            ) : (
              <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
                {bookings.slice(0, 10).map((b, i, arr) => {
                  const action = ACTION_FOR[b.status];
                  const done = b.status === 'completed';
                  return (
                    <View key={b.id} style={[styles.bookingRow, i === Math.min(arr.length, 10) - 1 && { borderBottomWidth: 0 }]}>
                      <View style={styles.timePill}><Text style={styles.timeText}>{timeOf(b.scheduled_at)}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bName}>{b.vehicle?.name ?? 'Customer'}</Text>
                        <Text style={styles.bMeta}>{b.service?.name ?? ''} · {money(b.total_amount)}</Text>
                      </View>
                      {done ? (
                        <View style={styles.donePill}><Feather name="check" size={12} color={colors.good} /><Text style={styles.doneText}>Done</Text></View>
                      ) : action ? (
                        <Pressable style={[styles.actionBtn, advancing === b.id && { opacity: 0.6 }]} onPress={() => advance(b)} disabled={advancing === b.id}>
                          {advancing === b.id ? <ActivityIndicator size="small" color={colors.blue} /> : <Text style={styles.actionText}>{action}</Text>}
                        </Pressable>
                      ) : (
                        <Text style={styles.statusText}>{b.status}</Text>
                      )}
                    </View>
                  );
                })}
              </Card>
            )}

            <View style={[styles.grid, { marginTop: 20 }]}>
              <Pressable style={styles.actionCard} onPress={() => toast('Services & pricing — manage in the admin panel')}>
                <Feather name="settings" size={20} color={colors.blue} />
                <Text style={styles.actionCardText}>Manage services</Text>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => toast('Promotions — manage in the admin panel')}>
                <Feather name="send" size={20} color={colors.amber} />
                <Text style={styles.actionCardText}>Promotions</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 22, paddingBottom: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bizName: { color: '#fff', fontFamily: font.display, fontSize: 17 },
  bizSub: { color: colors.onNavyMute2, fontSize: 12.5, fontFamily: font.body },
  bizBadge: { backgroundColor: 'rgba(245,158,11,0.16)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  bizBadgeText: { color: colors.amber, fontFamily: font.display, fontSize: 10.5, letterSpacing: 0.6 },

  revenueCard: { borderRadius: radius.xl, padding: 20, overflow: 'hidden', ...shadow.card },
  glow: { position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(245,158,11,0.16)' },
  revLabel: { color: colors.onNavyMute, fontSize: 12, letterSpacing: 0.5, fontFamily: font.body },
  revValue: { color: '#fff', fontFamily: font.displayBold, fontSize: 32, marginTop: 4 },
  revSub: { color: colors.onNavySoft, fontSize: 12.5, marginTop: 6, fontFamily: font.body },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  stat: { width: '47%', flexGrow: 1, padding: 16 },
  statLabel: { color: colors.inkFaint, fontSize: 12, fontFamily: font.body },
  statValue: { fontFamily: font.displayBold, fontSize: 26, color: colors.ink, marginTop: 4 },
  statDelta: { fontSize: 12, fontFamily: font.bodySemi, marginTop: 2 },

  h3: { fontFamily: font.display, fontSize: 16, color: colors.ink, marginBottom: 12 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  timePill: { backgroundColor: colors.blueTint2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  timeText: { color: colors.blue, fontFamily: font.display, fontSize: 13 },
  bName: { fontFamily: font.display, fontSize: 13.5, color: colors.ink },
  bMeta: { color: colors.inkFaint, fontSize: 11.5, marginTop: 2, fontFamily: font.body },
  actionBtn: { backgroundColor: colors.blueTint2, borderWidth: 1, borderColor: '#CFE0FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 84, alignItems: 'center' },
  actionText: { color: colors.blue, fontFamily: font.display, fontSize: 12.5 },
  statusText: { color: colors.inkFaint, fontSize: 12, fontFamily: font.bodyMed, textTransform: 'capitalize' },
  donePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.goodTint, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7 },
  doneText: { color: colors.good, fontFamily: font.display, fontSize: 12 },

  actionCard: { width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E6EAF0', borderRadius: radius.md, padding: 15, gap: 8, ...shadow.soft },
  actionCardText: { fontFamily: font.display, fontSize: 13.5, color: colors.ink },
});
