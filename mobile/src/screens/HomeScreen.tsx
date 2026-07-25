import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, radius, shadow } from '../theme';
import { Card, Stars, Loading, ErrorState } from '../components/ui';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../hooks/useAsync';
import * as api from '../api/endpoints';
import { TenantSummary, Vehicle, VouchersResponse } from '../api/types';
import { money, num, initials } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const PIN_POS = [
  { top: '26%', left: '40%' }, { top: '50%', left: '21%' },
  { top: '38%', left: '70%' }, { top: '68%', left: '55%' },
  { top: '30%', left: '58%' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user, token, signOut } = useAuth();
  const [mapView, setMapView] = React.useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const [vehicles, vouchers, tenants] = await Promise.all([
      api.getVehicles(token!),
      api.getVouchers(token!),
      api.getTenants(),
    ]);
    return { vehicles, vouchers, tenants: tenants.data };
  }, [token]);

  const vehicle: Vehicle | undefined = data?.vehicles.find((v) => v.is_default) ?? data?.vehicles[0];
  const vouchers: VouchersResponse | undefined = data?.vouchers;
  const active = vouchers?.data.filter((v) => v.status === 'active') ?? [];
  const balance = active.reduce((s, v) => s + num(v.amount), 0);
  const progress = vouchers?.progress;
  const tenants: TenantSummary[] = data?.tenants ?? [];

  const confirmSignOut = () =>
    Alert.alert('Sign out', 'Sign out of WashRewards?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Navy header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <Pressable onLongPress={confirmSignOut} delayLongPress={500} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(user?.name)}</Text>
              </Pressable>
              <View>
                <Text style={styles.welcome}>Welcome back</Text>
                <Text style={styles.userName}>{user?.name ?? 'Guest'}</Text>
              </View>
            </View>
            <Pressable style={styles.bell} onPress={() => nav.navigate('Notifications')}>
              <Feather name="bell" size={21} color="#fff" />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          <Pressable
            style={styles.vehicleChip}
            onPress={() => nav.navigate('AddVehicle')}
          >
            <Feather name="truck" size={15} color={colors.onNavyMute} />
            {vehicle ? (
              <>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <View style={styles.dotSep} />
                <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
              </>
            ) : (
              <Text style={styles.vehicleName}>Add your vehicle</Text>
            )}
          </Pressable>
          <View style={{ height: 80 }} />
        </View>

        <View style={{ paddingHorizontal: 22, marginTop: -80 }}>
          {/* Voucher balance card */}
          <LinearGradient colors={[colors.navy2, colors.navy3, colors.navy4]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.voucherCard}>
            <View style={styles.glow} />
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <LinearGradient colors={[colors.amber, colors.amber2]} style={styles.amberSquare} />
                <Text style={styles.brandText}>WashRewards</Text>
              </View>
              <LinearGradient colors={[colors.amber, colors.amber2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.voucherBadge}>
                <Text style={styles.voucherBadgeText}>{active.length} VOUCHER{active.length === 1 ? '' : 'S'}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.voucherLabel}>VOUCHER BALANCE</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceValue}>{money(balance)}</Text>
              <Text style={styles.balanceReady}>{active.length ? 'ready' : ''}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.cardNumber}>{user?.name?.toUpperCase() ?? ''}</Text>
              <Feather name="wifi" size={20} color={colors.amber} style={{ opacity: 0.85 }} />
            </View>
          </LinearGradient>

          <Pressable
            style={({ pressed }) => [styles.bookBtn, pressed && { backgroundColor: colors.blueDark }, tenants.length === 0 && { opacity: 0.6 }]}
            onPress={() => tenants[0] && nav.navigate('Booking', { tenantId: tenants[0].id })}
            disabled={tenants.length === 0}
          >
            <Feather name="droplet" size={20} color="#fff" />
            <Text style={styles.bookBtnText}>Book a Wash</Text>
          </Pressable>

          {/* Voucher progress */}
          {progress && (
            <Card style={styles.progressCard}>
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <LinearGradient colors={[colors.amber, colors.amber2]} style={styles.rCoin}>
                    <Text style={styles.rCoinText}>R</Text>
                  </LinearGradient>
                  <Text style={styles.progressTitle}>{money(progress.voucher_amount)} voucher progress</Text>
                </View>
                <Text style={styles.progressCount}>{progress.wash_count}/{progress.threshold}</Text>
              </View>
              <View style={styles.dotsRow}>
                {Array.from({ length: progress.threshold }).map((_, i) => (
                  <View key={i} style={[styles.dot, i < progress.wash_count ? null : styles.dotEmpty]}>
                    {i < progress.wash_count ? <LinearGradient colors={[colors.amber, colors.amber2]} style={StyleSheet.absoluteFill} /> : null}
                  </View>
                ))}
              </View>
              <Text style={styles.progressSub}>
                {progress.remaining} more wash{progress.remaining === 1 ? '' : 'es'} to earn a {money(progress.voucher_amount)} voucher — redeemable at any partner.
              </Text>
            </Card>
          )}

          <Pressable style={styles.rateCard} onPress={() => nav.navigate('Rating')}>
            <View style={styles.rateIcon}><Stars value={1} size={20} gap={0} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateTitle}>Rate your recent wash</Text>
              <Text style={styles.rateSub}>Share feedback on a completed wash</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#6E80A0" />
          </Pressable>
        </View>

        {/* Nearby */}
        <View style={{ paddingHorizontal: 22, paddingTop: 24 }}>
          <View style={[styles.rowBetween, { marginBottom: 14 }]}>
            <Text style={styles.sectionTitle}>Nearby car washes</Text>
            <View style={styles.toggle}>
              <Pressable onPress={() => setMapView(false)} style={[styles.toggleBtn, !mapView && styles.toggleActive]}>
                <Text style={[styles.toggleText, !mapView && styles.toggleTextActive]}>List</Text>
              </Pressable>
              <Pressable onPress={() => setMapView(true)} style={[styles.toggleBtn, mapView && styles.toggleActive]}>
                <Text style={[styles.toggleText, mapView && styles.toggleTextActive]}>Map</Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : mapView ? (
            <View style={styles.mapMock}>
              <View style={styles.mapLabel}><Text style={styles.mapLabelText}>Johannesburg</Text></View>
              <View style={styles.mapMe} />
              {tenants.slice(0, 5).map((t, i) => (
                <Pressable
                  key={t.id}
                  onPress={() => nav.navigate('Booking', { tenantId: t.id })}
                  style={[styles.pin, { top: PIN_POS[i].top as any, left: PIN_POS[i].left as any }]}
                >
                  <View style={[styles.pinBubble, i === 0 ? styles.pinFeatured : styles.pinNormal]}>
                    <Text style={[styles.pinText, { color: i === 0 ? colors.navy : '#fff' }]}>{money(t.from_price)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            tenants.map((t) => (
              <Pressable key={t.id} style={styles.partnerCard} onPress={() => nav.navigate('Booking', { tenantId: t.id })}>
                <LinearGradient colors={[colors.navy3, colors.navy4]} style={styles.partnerThumb}>
                  <Feather name={t.type === 'mobile_wash' ? 'truck' : 'image'} size={18} color={colors.onNavyMute} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerName}>{t.name}</Text>
                  <View style={[styles.row, { marginTop: 3, gap: 5 }]}>
                    <Feather name="map-pin" size={12} color={colors.inkMute} />
                    <Text style={styles.partnerArea}>{t.type === 'mobile_wash' ? 'Mobile · comes to you' : `${t.suburb ?? ''}${t.city ? ', ' + t.city : ''}`}</Text>
                  </View>
                  <View style={[styles.row, { marginTop: 8, gap: 7 }]}>
                    <View style={styles.row}>
                      <Stars value={1} size={13} gap={0} />
                      <Text style={styles.ratingText}> {t.rating_avg.toFixed(1)}</Text>
                    </View>
                    {t.distance_km != null && (<><Text style={styles.sep}>·</Text><Text style={styles.partnerMeta}>{t.distance_km} km</Text></>)}
                    <Text style={styles.sep}>·</Text>
                    <Text style={styles.partnerMeta}>from {money(t.from_price)}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#C2CAD4" />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 22, paddingBottom: 96 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: font.displayBold, fontSize: 17 },
  welcome: { color: colors.onNavyMute2, fontSize: 12.5, fontFamily: font.body },
  userName: { color: '#fff', fontFamily: font.display, fontSize: 16 },
  bell: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber, borderWidth: 2, borderColor: colors.navy },
  vehicleChip: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 13, paddingHorizontal: 13, paddingVertical: 9, alignSelf: 'flex-start' },
  vehicleName: { color: '#fff', fontFamily: font.display, fontSize: 13 },
  vehiclePlate: { color: colors.onNavyMute, fontSize: 12.5, fontFamily: font.body },
  dotSep: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.onNavyMute2 },

  voucherCard: { borderRadius: radius.xl, padding: 22, overflow: 'hidden', ...shadow.card },
  glow: { position: 'absolute', top: -46, right: -34, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(245,158,11,0.18)' },
  amberSquare: { width: 26, height: 26, borderRadius: 8 },
  brandText: { color: '#fff', fontFamily: font.display, fontSize: 14 },
  voucherBadge: { borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6 },
  voucherBadgeText: { color: colors.navy, fontFamily: font.displayBold, fontSize: 10.5, letterSpacing: 0.9 },
  voucherLabel: { color: colors.onNavyMute, fontSize: 12, letterSpacing: 0.5, marginTop: 24, fontFamily: font.body },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  balanceValue: { color: '#fff', fontFamily: font.displayBold, fontSize: 46 },
  balanceReady: { color: colors.amber, fontFamily: font.display, fontSize: 15 },
  cardNumber: { color: colors.onNavySoft, fontFamily: font.display, fontSize: 13, letterSpacing: 1, marginTop: 22 },

  bookBtn: { marginTop: 18, backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.blue },
  bookBtnText: { color: '#fff', fontSize: 16, fontFamily: font.display },

  progressCard: { marginTop: 14, padding: 16, borderColor: '#F1E7CE' },
  rCoin: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rCoinText: { color: colors.navy, fontFamily: font.displayBold, fontSize: 11 },
  progressTitle: { fontFamily: font.display, fontSize: 14, color: colors.ink },
  progressCount: { fontFamily: font.displayBold, fontSize: 13, color: colors.amberInk },
  dotsRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  dot: { flex: 1, height: 13, borderRadius: 999, overflow: 'hidden' },
  dotEmpty: { borderWidth: 1.5, borderColor: '#C9D2DE', borderStyle: 'dashed' },
  progressSub: { marginTop: 11, color: colors.inkSoft, fontSize: 12, fontFamily: font.body },

  rateCard: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: colors.navy, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14 },
  rateIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.18)', alignItems: 'center', justifyContent: 'center' },
  rateTitle: { color: '#fff', fontFamily: font.display, fontSize: 13.5 },
  rateSub: { color: colors.onNavyMute, fontSize: 12, marginTop: 2, fontFamily: font.body },

  sectionTitle: { fontFamily: font.display, fontSize: 17, color: colors.ink },
  toggle: { flexDirection: 'row', backgroundColor: '#EAEDF2', borderRadius: 11, padding: 3, gap: 2 },
  toggleBtn: { borderRadius: 9, paddingHorizontal: 13, paddingVertical: 6 },
  toggleActive: { backgroundColor: '#fff', ...shadow.soft },
  toggleText: { fontSize: 12.5, fontFamily: font.display, color: colors.onNavyMute2 },
  toggleTextActive: { color: colors.navy },

  partnerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 12, marginBottom: 12, ...shadow.soft },
  partnerThumb: { width: 62, height: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  partnerName: { fontFamily: font.display, fontSize: 15, color: colors.ink },
  partnerArea: { color: colors.inkSoft, fontSize: 12.5, fontFamily: font.body, flexShrink: 1 },
  ratingText: { color: colors.ink, fontFamily: font.display, fontSize: 12.5 },
  partnerMeta: { color: colors.inkSoft, fontSize: 12.5, fontFamily: font.body },
  sep: { color: '#D2D8E0' },

  mapMock: { height: 340, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: '#E3E8EF', backgroundColor: '#E9EEF4' },
  mapLabel: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5 },
  mapLabelText: { fontFamily: font.display, fontSize: 10.5, color: '#5C6B7D' },
  mapMe: { position: 'absolute', top: '46%', left: '48%', width: 15, height: 15, borderRadius: 8, backgroundColor: colors.blue, borderWidth: 3, borderColor: '#fff' },
  pin: { position: 'absolute' },
  pinBubble: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, ...shadow.card },
  pinFeatured: { backgroundColor: colors.amber },
  pinNormal: { backgroundColor: colors.blue },
  pinText: { fontFamily: font.displayBold, fontSize: 12 },
});
