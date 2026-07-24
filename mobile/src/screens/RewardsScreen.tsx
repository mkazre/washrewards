import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { colors, font, radius, shadow } from '../theme';
import { Card } from '../components/ui';
import { voucher, txns } from '../data/mock';
import { useToast } from '../components/Toast';

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const washRemaining = 5 - voucher.washCount;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title}>Rewards</Text>
          <Text style={styles.label}>VOUCHER BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceValue}>{voucher.balance}</Text>
            <Text style={styles.balanceReady}>ready</Text>
          </View>
          <Text style={styles.headerSub}>
            {voucher.count} voucher ready to redeem · earn a R100 voucher every 5 paid washes.
          </Text>
        </View>

        <View style={{ padding: 22 }}>
          <Text style={styles.h3}>Your R100 voucher</Text>
          <LinearGradient colors={[colors.navy2, colors.navy4]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.voucherCard}>
            <View style={styles.glow} />
            <View style={styles.rowBetween}>
              <Text style={styles.washCount}>{voucher.washCount} of 5 washes</Text>
              <LinearGradient colors={[colors.amber, colors.amber2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badge}>
                <Text style={styles.badgeText}>R100 REWARD</Text>
              </LinearGradient>
            </View>
            <View style={styles.dotsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={[styles.dot, i < voucher.washCount ? null : styles.dotEmpty]}>
                  {i < voucher.washCount ? <LinearGradient colors={[colors.amber, colors.amber2]} style={StyleSheet.absoluteFill} /> : null}
                </View>
              ))}
            </View>
            <Text style={styles.voucherSub}>{washRemaining} more paid washes to unlock your next R100 voucher.</Text>
          </LinearGradient>

          <Card style={styles.voucherItem}>
            <LinearGradient colors={[colors.amber, colors.amber2]} style={styles.r100}>
              <Text style={styles.r100Text}>R100</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.voucherItemTitle}>R100 Wash Voucher</Text>
              <Text style={styles.voucherItemSub}>Earned · expires in 54 days · any partner</Text>
            </View>
            <Pressable style={styles.redeemBtn} onPress={() => toast('Redeemed · R100 Wash Voucher')}>
              <Text style={styles.redeemText}>Redeem</Text>
            </Pressable>
          </Card>

          <Text style={[styles.h3, { marginTop: 24, marginBottom: 6 }]}>Recent activity</Text>
          <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            {txns.map((t, i) => (
              <View key={i} style={[styles.txnRow, i === txns.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.txnIcon}>
                  <Feather name="truck" size={18} color="#5C6B7D" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txnTitle}>{t.title}</Text>
                  <Text style={styles.txnSub}>{t.sub}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: t.kind === 'reward' ? colors.good : colors.ink }]}>{t.amount}</Text>
              </View>
            ))}
          </Card>
        </View>
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

  voucherItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginTop: 12, borderColor: '#F4E3BE' },
  r100: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  r100Text: { color: colors.navy, fontFamily: font.displayBold, fontSize: 14 },
  voucherItemTitle: { fontFamily: font.display, fontSize: 14.5, color: colors.ink },
  voucherItemSub: { color: colors.inkSoft, fontSize: 12, marginTop: 2, fontFamily: font.body },
  redeemBtn: { backgroundColor: colors.blue, borderRadius: 11, paddingHorizontal: 15, paddingVertical: 9 },
  redeemText: { color: '#fff', fontFamily: font.display, fontSize: 13 },

  txnRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  txnIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#F1F4F9', alignItems: 'center', justifyContent: 'center' },
  txnTitle: { fontFamily: font.display, fontSize: 13.5, color: colors.ink },
  txnSub: { color: colors.inkFaint, fontSize: 11.5, marginTop: 2, fontFamily: font.body },
  txnAmount: { fontFamily: font.display, fontSize: 14 },
});
