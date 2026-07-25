import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, radius, shadow } from '../theme';
import { Stars, Loading, ErrorState } from '../components/ui';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../hooks/useAsync';
import * as api from '../api/endpoints';
import { ApiError } from '../api/client';
import { money, num, slotToISO, relativeDay } from '../utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SLOTS = [
  { label: '09:30' }, { label: '11:00' }, { label: '12:30', disabled: true },
  { label: '14:00' }, { label: '15:30' }, { label: '17:00' },
];
const PAY_METHODS = [
  { brand: 'VISA', label: 'Visa', hint: '•••• 4827', method: 'card' as const },
  { brand: 'MC', label: 'Mastercard', hint: '•••• 1190', method: 'card' as const },
  { brand: 'EFT', label: 'Instant EFT', hint: 'Pay from your bank', method: 'eft' as const },
];

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { tenantId } = useRoute<RouteProp<RootStackParamList, 'Booking'>>().params;
  const { token } = useAuth();

  const [serviceIdx, setServiceIdx] = useState(0);
  const [slotIdx, setSlotIdx] = useState(0);
  const [payIdx, setPayIdx] = useState(0);
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const [tenant, vehicles] = await Promise.all([api.getTenant(tenantId), api.getVehicles(token!)]);
    return { tenant, vehicle: vehicles.find((v) => v.is_default) ?? vehicles[0] ?? null };
  }, [tenantId, token]);

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.surface }}><View style={{ paddingTop: insets.top + 40 }}><Loading /></View></View>;
  if (error || !data) return <View style={{ flex: 1, backgroundColor: colors.surface }}><View style={{ paddingTop: insets.top + 40 }}><ErrorState message={error || 'Not found'} onRetry={reload} /></View></View>;

  const { tenant, vehicle } = data;
  const services = tenant.services ?? [];
  const isMobile = tenant.type === 'mobile_wash';
  const service = services[serviceIdx];
  const slot = SLOTS[slotIdx];
  const pm = PAY_METHODS[payIdx];
  const travelFee = isMobile ? num(tenant.travel_fee) : 0;
  const total = num(service?.price) + travelFee;

  const confirm = async () => {
    if (!service) return;
    if (!vehicle) {
      Alert.alert('Add a vehicle', 'Add your vehicle before booking a wash.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add vehicle', onPress: () => nav.navigate('AddVehicle') },
      ]);
      return;
    }
    if (isMobile && !address.trim()) {
      Alert.alert('Address needed', 'Enter the address where the mobile wash should come to.');
      return;
    }
    setBusy(true);
    try {
      const iso = slotToISO(slot.label);
      const booking = await api.createBooking(token!, {
        tenant_id: tenant.id,
        service_id: service.id,
        vehicle_id: vehicle.id,
        scheduled_at: iso,
        payment_method: pm.method,
        service_address: isMobile ? address.trim() : undefined,
      });
      const pay = await api.payBooking(token!, booking.id);
      let washCount = 0, threshold = 5;
      try { const v = await api.getVouchers(token!); washCount = v.progress.wash_count; threshold = v.progress.threshold; } catch { /* non-fatal */ }

      const tomorrow = new Date(iso).getDate() !== new Date().getDate();
      nav.navigate('Confirmation', {
        partnerName: tenant.name,
        vehicleName: `${vehicle.name} · ${vehicle.plate}`,
        serviceName: service.name,
        amount: money(pay.booking.total_amount),
        scheduledLabel: `${tomorrow ? 'Tomorrow' : 'Today'} at ${slot.label}`,
        payLabel: pm.hint ? `${pm.label} ${pm.hint}` : pm.label,
        receiptNo: pay.booking.receipt_no,
        washCount, threshold,
        voucherEarned: !!pay.voucher_earned,
      });
    } catch (e) {
      const err = e as ApiError;
      const first = err.errors ? Object.values(err.errors)[0]?.[0] : undefined;
      Alert.alert('Could not complete booking', first || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <LinearGradient colors={[colors.navy3, colors.navy4]} style={styles.hero}>
          <Pressable style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => nav.goBack()}>
            <Feather name="chevron-left" size={20} color="#fff" />
          </Pressable>
          <View style={styles.openBadge}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>{isMobile ? 'Comes to you' : 'Open now'}</Text>
          </View>
          <Feather name={isMobile ? 'truck' : 'image'} size={30} color="rgba(255,255,255,0.4)" style={{ alignSelf: 'center', marginTop: 70 }} />
        </LinearGradient>

        <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerName}>{tenant.name}</Text>
              <View style={[styles.row, { marginTop: 5, gap: 7 }]}>
                <Feather name="map-pin" size={13} color={colors.inkMute} />
                <Text style={styles.metaText}>
                  {isMobile ? `Mobile · ${tenant.travel_radius_km ?? ''} km radius` : `${tenant.suburb ?? ''}${tenant.city ? ', ' + tenant.city : ''}`}
                </Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Stars value={1} size={13} gap={0} />
              <Text style={styles.ratingBadgeText}>{tenant.rating_avg.toFixed(1)}</Text>
            </View>
          </View>

          {/* Vehicle */}
          <Pressable style={styles.vehicleRow} onPress={() => nav.navigate('AddVehicle')}>
            <Feather name="truck" size={20} color="#5C6B7D" />
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleLabel}>Vehicle</Text>
              <Text style={styles.vehicleName}>{vehicle ? `${vehicle.name} · ${vehicle.plate}` : 'Add your vehicle'}</Text>
            </View>
            <Text style={styles.change}>{vehicle ? 'Change' : 'Add'}</Text>
          </Pressable>

          {/* Mobile address */}
          {isMobile && (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.h3}>Where should we come?</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Street address, suburb"
                placeholderTextColor={colors.inkMute}
                style={styles.addressInput}
              />
              {travelFee > 0 && <Text style={styles.travelNote}>Includes a {money(travelFee)} call-out fee.</Text>}
            </View>
          )}

          {/* Packages */}
          <Text style={styles.h3}>Choose a package</Text>
          {services.length === 0 && <Text style={styles.metaText}>No packages available yet.</Text>}
          {services.map((pk, i) => {
            const sel = i === serviceIdx;
            return (
              <Pressable key={pk.id} onPress={() => setServiceIdx(i)} style={[styles.pkgCard, sel ? styles.pkgSel : styles.pkgUnsel]}>
                <View style={[styles.radio, sel ? styles.radioSel : styles.radioUnsel]}>
                  {sel ? <Feather name="check" size={13} color="#fff" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.row, { gap: 8 }]}>
                    <Text style={styles.pkgName}>{pk.name}</Text>
                    {pk.is_popular ? <View style={styles.popular}><Text style={styles.popularText}>POPULAR</Text></View> : null}
                  </View>
                  {pk.description ? <Text style={styles.pkgDesc}>{pk.description}</Text> : null}
                  {pk.duration_minutes ? <Text style={styles.pkgTime}>≈ {pk.duration_minutes} min</Text> : null}
                </View>
                <Text style={styles.pkgPrice}>{money(pk.price)}</Text>
              </Pressable>
            );
          })}

          {/* Slots */}
          <View style={[styles.rowBetween, { marginTop: 24, marginBottom: 12 }]}>
            <Text style={styles.h3}>Available today</Text>
          </View>
          <View style={styles.slotGrid}>
            {SLOTS.map((s, i) => {
              const sel = i === slotIdx;
              return (
                <Pressable key={s.label} onPress={() => !s.disabled && setSlotIdx(i)} style={[styles.slot, s.disabled ? styles.slotDisabled : sel ? styles.slotSel : styles.slotUnsel]}>
                  <Text style={[styles.slotText, s.disabled ? styles.slotTextDisabled : sel ? styles.slotTextSel : styles.slotTextUnsel]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Reviews */}
          {tenant.reviews && tenant.reviews.length > 0 && (
            <>
              <Text style={[styles.h3, { marginTop: 26 }]}>Verified reviews</Text>
              <View style={[styles.row, { gap: 12, marginBottom: 14 }]}>
                <Text style={styles.reviewBig}>{tenant.rating_avg.toFixed(1)}</Text>
                <View>
                  <Stars value={5} size={14} />
                  <Text style={styles.reviewCount}>{tenant.rating_count} verified reviews</Text>
                </View>
              </View>
              {tenant.reviews.slice(0, 3).map((rv) => (
                <View key={rv.id} style={styles.reviewCard}>
                  <View style={[styles.row, { gap: 8 }]}>
                    <Text style={styles.reviewer}>{rv.user_name ?? 'Customer'}</Text>
                    {rv.is_verified && (
                      <View style={styles.verified}>
                        <Feather name="check" size={10} color={colors.good} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                    <Text style={styles.reviewWhen}>{relativeDay(rv.created_at)}</Text>
                  </View>
                  <View style={{ marginTop: 8 }}><Stars value={rv.rating} size={13} /></View>
                  {rv.comment ? <Text style={styles.reviewText}>{rv.comment}</Text> : null}
                </View>
              ))}
            </>
          )}

          {/* Payment */}
          <Text style={[styles.h3, { marginTop: 26 }]}>Payment method</Text>
          {PAY_METHODS.map((m, i) => {
            const sel = i === payIdx;
            return (
              <Pressable key={m.brand} onPress={() => setPayIdx(i)} style={[styles.payCard, sel ? styles.pkgSel : styles.pkgUnsel]}>
                <View style={styles.payBrand}><Text style={styles.payBrandText}>{m.brand}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payLabel}>{m.label}</Text>
                  <Text style={styles.payNum}>{m.hint}</Text>
                </View>
                <View style={[styles.radio, sel ? styles.radioSel : styles.radioUnsel]}>
                  {sel ? <Feather name="check" size={12} color="#fff" /> : null}
                </View>
              </Pressable>
            );
          })}
          <View style={[styles.row, { gap: 7, marginTop: 4 }]}>
            <Feather name="lock" size={13} color={colors.inkMute} />
            <Text style={styles.secureText}>Payments are encrypted and PCI-DSS secured.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky pay bar */}
      <View style={[styles.payBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.rowBetween, { marginBottom: 12 }]}>
          <View>
            <Text style={styles.payBarMeta}>{service?.name ?? '—'} · {slot.label}</Text>
            <Text style={styles.payBarPrice}>{money(total)}</Text>
          </View>
          <View style={[styles.row, { gap: 5 }]}>
            <LinearGradient colors={[colors.amber, colors.amber2]} style={styles.miniCoin} />
            <Text style={styles.countsText}>Counts toward voucher</Text>
          </View>
        </View>
        <Pressable style={[styles.confirmBtn, busy && { opacity: 0.7 }]} onPress={confirm} disabled={busy || !service}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm & Pay {money(total)}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 196, justifyContent: 'flex-start' },
  backBtn: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(9,24,48,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  openBadge: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(22,163,74,0.92)', borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  openText: { color: '#fff', fontFamily: font.display, fontSize: 11.5 },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  partnerName: { fontFamily: font.displayBold, fontSize: 22, color: colors.ink },
  metaText: { color: colors.inkSoft, fontSize: 13, fontFamily: font.body, flexShrink: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.amberTint, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 7 },
  ratingBadgeText: { color: colors.amberInk, fontFamily: font.displayBold, fontSize: 13 },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  vehicleLabel: { fontSize: 11.5, color: colors.inkFaint, fontFamily: font.body },
  vehicleName: { fontFamily: font.display, fontSize: 14, color: colors.ink },
  change: { color: colors.blue, fontSize: 12.5, fontFamily: font.bodySemi },

  addressInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line2, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: colors.ink, fontSize: 14.5, fontFamily: font.body },
  travelNote: { color: colors.amberInk, fontSize: 12, marginTop: 6, fontFamily: font.body },

  h3: { fontFamily: font.display, fontSize: 16, color: colors.ink, marginTop: 24, marginBottom: 12 },
  pkgCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radius.lg, padding: 15, marginBottom: 12, borderWidth: 1.5 },
  pkgSel: { borderColor: colors.blue, backgroundColor: colors.blueTint },
  pkgUnsel: { borderColor: colors.line3, backgroundColor: colors.surface },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioSel: { borderColor: colors.blue, backgroundColor: colors.blue },
  radioUnsel: { borderColor: '#CBD2DC', backgroundColor: colors.surface },
  pkgName: { fontFamily: font.display, fontSize: 15, color: colors.ink },
  popular: { backgroundColor: colors.navy, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  popularText: { color: colors.amber, fontFamily: font.display, fontSize: 9.5, letterSpacing: 0.6 },
  pkgDesc: { color: colors.inkSoft, fontSize: 12.5, marginTop: 3, fontFamily: font.body },
  pkgTime: { color: colors.inkMute, fontSize: 11.5, marginTop: 4, fontFamily: font.body },
  pkgPrice: { fontFamily: font.displayBold, fontSize: 17, color: colors.ink },

  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { width: '31%', flexGrow: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  slotSel: { backgroundColor: colors.blue, borderColor: colors.blue },
  slotUnsel: { backgroundColor: colors.surface, borderColor: colors.line2 },
  slotDisabled: { backgroundColor: '#F1F3F6', borderColor: '#F1F3F6' },
  slotText: { fontFamily: font.display, fontSize: 14 },
  slotTextSel: { color: '#fff' },
  slotTextUnsel: { color: colors.ink },
  slotTextDisabled: { color: '#AEB6C0', textDecorationLine: 'line-through' },

  reviewBig: { fontFamily: font.displayBold, fontSize: 30, color: colors.ink },
  reviewCount: { color: colors.inkFaint, fontSize: 12, marginTop: 3, fontFamily: font.body },
  reviewCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, marginBottom: 10, ...shadow.soft },
  reviewer: { fontFamily: font.display, fontSize: 13.5, color: colors.ink },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.goodTint, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText: { color: colors.good, fontSize: 10.5, fontFamily: font.display },
  reviewWhen: { marginLeft: 'auto', color: '#A6B0BC', fontSize: 11.5, fontFamily: font.body },
  reviewText: { color: '#5A6675', fontSize: 12.5, marginTop: 8, lineHeight: 18, fontFamily: font.body },

  payCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1.5 },
  payBrand: { width: 42, height: 30, borderRadius: 7, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  payBrandText: { color: '#fff', fontFamily: font.displayBold, fontSize: 10 },
  payLabel: { fontFamily: font.display, fontSize: 13.5, color: colors.ink },
  payNum: { color: colors.inkFaint, fontSize: 12, marginTop: 2, fontFamily: font.body },
  secureText: { color: colors.inkFaint, fontSize: 11.5, fontFamily: font.body },

  payBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line3, paddingHorizontal: 22, paddingTop: 14, shadowColor: '#091830', shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 10 },
  payBarMeta: { color: colors.inkFaint, fontSize: 12, fontFamily: font.body },
  payBarPrice: { fontFamily: font.displayBold, fontSize: 22, color: colors.ink },
  miniCoin: { width: 14, height: 14, borderRadius: 7 },
  countsText: { color: colors.good, fontSize: 12, fontFamily: font.bodySemi },
  confirmBtn: { backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 17, alignItems: 'center', ...shadow.blue },
  confirmText: { color: '#fff', fontSize: 16, fontFamily: font.display },
});
