import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { colors, font, radius, shadow } from '../theme';
import { Card, Stars } from '../components/ui';
import { todayBookings } from '../data/mock';
import { useToast } from '../components/Toast';

type Status = 'Upcoming' | 'Arrived' | 'Completed';

export default function PartnerScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [statuses, setStatuses] = useState<Status[]>(['Completed', 'Arrived', 'Upcoming', 'Upcoming']);

  const advance = (i: number) => {
    const next: Record<Status, Status> = { Upcoming: 'Arrived', Arrived: 'Completed', Completed: 'Completed' };
    setStatuses((s) => s.map((v, idx) => (idx === i ? next[v] : v)));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <LinearGradient colors={[colors.navy3, colors.navy4]} style={styles.logo}>
                <Feather name="image" size={16} color={colors.onNavyMute} />
              </LinearGradient>
              <View>
                <Text style={styles.bizName}>Sparkle & Shine</Text>
                <Text style={styles.bizSub}>Sandton City · Partner</Text>
              </View>
            </View>
            <View style={styles.bizBadge}>
              <Text style={styles.bizBadgeText}>BUSINESS</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 22 }}>
          {/* Revenue */}
          <LinearGradient colors={[colors.navy2, colors.navy4]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.revenueCard}>
            <View style={styles.glow} />
            <Text style={styles.revLabel}>REVENUE SETTLED</Text>
            <Text style={styles.revValue}>R48,920</Text>
            <Text style={styles.revSub}>This month · <Text style={{ color: '#34D399', fontFamily: font.bodySemi }}>+12%</Text> vs May</Text>
          </LinearGradient>

          {/* Stat grid */}
          <View style={styles.grid}>
            <Card style={styles.stat}>
              <Text style={styles.statLabel}>Today's bookings</Text>
              <Text style={styles.statValue}>14</Text>
              <Text style={[styles.statDelta, { color: colors.blue }]}>3 upcoming</Text>
            </Card>
            <Card style={styles.stat}>
              <Text style={styles.statLabel}>Customers / month</Text>
              <Text style={styles.statValue}>312</Text>
              <Text style={[styles.statDelta, { color: '#16A34A' }]}>+28 new</Text>
            </Card>
            <Card style={styles.stat}>
              <Text style={styles.statLabel}>QR sign-ups</Text>
              <Text style={styles.statValue}>86</Text>
              <Text style={[styles.statDelta, { color: colors.blue }]}>via your poster</Text>
            </Card>
            <Card style={styles.stat}>
              <Text style={styles.statLabel}>Avg rating</Text>
              <View style={[styles.row, { gap: 5, marginTop: 4 }]}>
                <Text style={styles.statValue}>4.8</Text>
                <Stars value={1} size={17} gap={0} />
              </View>
              <Text style={[styles.statDelta, { color: '#16A34A' }]}>Top rated</Text>
            </Card>
          </View>

          {/* Today's bookings */}
          <Text style={[styles.h3, { marginTop: 24 }]}>Today's bookings</Text>
          <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            {todayBookings.map((b, i) => {
              const st = statuses[i];
              const done = st === 'Completed';
              const action = st === 'Arrived' ? 'Mark done' : st === 'Upcoming' ? 'Check in' : null;
              return (
                <View key={i} style={[styles.bookingRow, i === todayBookings.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.timePill}>
                    <Text style={styles.timeText}>{b.time}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bName}>{b.name}</Text>
                    <Text style={styles.bMeta}>{b.pkg} · {b.price}</Text>
                  </View>
                  {done ? (
                    <View style={styles.donePill}>
                      <Feather name="check" size={12} color={colors.good} />
                      <Text style={styles.doneText}>Done</Text>
                    </View>
                  ) : (
                    <Pressable style={styles.actionBtn} onPress={() => advance(i)}>
                      <Text style={styles.actionText}>{action}</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </Card>

          {/* Reviews */}
          <Text style={[styles.h3, { marginTop: 24 }]}>Recent reviews</Text>
          <Card style={{ padding: 16 }}>
            <View style={[styles.row, { gap: 8 }]}>
              <Text style={styles.bigRating}>4.8</Text>
              <Stars value={5} size={14} />
              <Text style={styles.reviewCount}>326 reviews</Text>
            </View>
            <View style={styles.reviewBody}>
              <View style={[styles.row, { gap: 8 }]}>
                <Text style={styles.reviewer}>Naledi M.</Text>
                <View style={styles.verified}>
                  <Feather name="check" size={10} color={colors.good} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
                <Text style={styles.reviewWhen}>2 days ago</Text>
              </View>
              <Text style={styles.reviewText}>Spotless finish and done in 40 minutes. Booking made it effortless.</Text>
            </View>
          </Card>

          {/* Actions */}
          <View style={[styles.grid, { marginTop: 20 }]}>
            <Pressable style={styles.actionCard} onPress={() => toast('Services & pricing editor opens here')}>
              <Feather name="settings" size={20} color={colors.blue} />
              <Text style={styles.actionCardText}>Manage services</Text>
            </Pressable>
            <Pressable style={styles.actionCard} onPress={() => toast('Promotion builder opens here')}>
              <Feather name="send" size={20} color={colors.amber} />
              <Text style={styles.actionCardText}>Promotions</Text>
            </Pressable>
          </View>

          <Pressable style={styles.analyticsBtn} onPress={() => toast('Full analytics dashboard opens here')}>
            <Feather name="bar-chart-2" size={19} color={colors.amber} />
            <Text style={styles.analyticsText}>View Analytics</Text>
          </Pressable>
        </View>
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
  actionBtn: { backgroundColor: colors.blueTint2, borderWidth: 1, borderColor: '#CFE0FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { color: colors.blue, fontFamily: font.display, fontSize: 12.5 },
  donePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.goodTint, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7 },
  doneText: { color: colors.good, fontFamily: font.display, fontSize: 12 },

  bigRating: { fontFamily: font.displayBold, fontSize: 24, color: colors.ink },
  reviewCount: { marginLeft: 'auto', color: colors.inkFaint, fontSize: 12, fontFamily: font.body },
  reviewBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F2F4F7' },
  reviewer: { fontFamily: font.display, fontSize: 13, color: colors.ink },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.goodTint, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText: { color: colors.good, fontSize: 10.5, fontFamily: font.display },
  reviewWhen: { marginLeft: 'auto', color: '#A6B0BC', fontSize: 11.5, fontFamily: font.body },
  reviewText: { color: '#5A6675', fontSize: 12.5, marginTop: 7, lineHeight: 18, fontFamily: font.body },

  actionCard: { width: '47%', flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#E6EAF0', borderRadius: radius.md, padding: 15, gap: 8, ...shadow.soft },
  actionCardText: { fontFamily: font.display, fontSize: 13.5, color: colors.ink },
  analyticsBtn: { marginTop: 14, backgroundColor: colors.navy, borderRadius: radius.md, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.card },
  analyticsText: { color: '#fff', fontSize: 15, fontFamily: font.display },
});
