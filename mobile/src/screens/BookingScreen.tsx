import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, radius, shadow } from '../theme';
import { Stars } from '../components/ui';
import { partners, packages, slots, payMethods, partnerReviews, vehicle, voucher } from '../data/mock';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Booking'>>();
  const partner = partners.find((p) => p.id === route.params.partnerId) ?? partners[0];

  const [pkg, setPkg] = useState(1);
  const [slot, setSlot] = useState(0);
  const [pay, setPay] = useState(0);

  const selPkg = packages[pkg];
  const selSlot = slots[slot];
  const pm = payMethods[pay];
  const payLabel = pm.last ? `${pm.label} •••• ${pm.last}` : pm.label;

  const confirm = () => {
    if (selSlot.disabled) return;
    nav.navigate('Confirmation', {
      partnerName: partner.name,
      vehicleName: vehicle.name,
      pkgName: selPkg.name,
      pkgPrice: selPkg.price,
      slot: selSlot.label,
      payLabel,
      receiptNo: 'WR-24819',
      washNext: Math.min(voucher.washCount + 1, 5),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Hero */}
        <LinearGradient colors={[colors.navy3, colors.navy4]} style={styles.hero}>
          <Pressable style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => nav.goBack()}>
            <Feather name="chevron-left" size={20} color="#fff" />
          </Pressable>
          <View style={styles.openBadge}>
            <View style={styles.openDot} />
            <Text style={styles.openText}>Open now</Text>
          </View>
          <Feather name="image" size={30} color="rgba(255,255,255,0.4)" style={{ alignSelf: 'center', marginTop: 70 }} />
        </LinearGradient>

        <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerName}>{partner.name}</Text>
              <View style={[styles.row, { marginTop: 5, gap: 7 }]}>
                <Feather name="map-pin" size={13} color={colors.inkMute} />
                <Text style={styles.metaText}>{partner.area} · {partner.dist}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Stars value={1} size={13} gap={0} />
              <Text style={styles.ratingBadgeText}>{partner.rating}</Text>
            </View>
          </View>

          {/* Vehicle */}
          <View style={styles.vehicleRow}>
            <Feather name="truck" size={20} color="#5C6B7D" />
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleLabel}>Vehicle</Text>
              <Text style={styles.vehicleName}>{vehicle.name} · {vehicle.plate}</Text>
            </View>
            <Text style={styles.change}>Change</Text>
          </View>

          {/* Packages */}
          <Text style={styles.h3}>Choose a package</Text>
          {packages.map((pk, i) => {
            const sel = i === pkg;
            return (
              <Pressable key={pk.id} onPress={() => setPkg(i)} style={[styles.pkgCard, sel ? styles.pkgSel : styles.pkgUnsel]}>
                <View style={[styles.radio, sel ? styles.radioSel : styles.radioUnsel]}>
                  {sel ? <Feather name="check" size={13} color="#fff" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.row, { gap: 8 }]}>
                    <Text style={styles.pkgName}>{pk.name}</Text>
                    {pk.popular ? (
                      <View style={styles.popular}><Text style={styles.popularText}>POPULAR</Text></View>
                    ) : null}
                  </View>
                  <Text style={styles.pkgDesc}>{pk.desc}</Text>
                  <Text style={styles.pkgTime}>≈ {pk.time}</Text>
                </View>
                <Text style={styles.pkgPrice}>{pk.price}</Text>
              </Pressable>
            );
          })}

          {/* Slots */}
          <View style={[styles.rowBetween, { marginTop: 24, marginBottom: 12 }]}>
            <Text style={styles.h3}>Available today</Text>
            <Text style={styles.metaText}>Mon, 23 Jun</Text>
          </View>
          <View style={styles.slotGrid}>
            {slots.map((s, i) => {
              const sel = i === slot;
              return (
                <Pressable
                  key={s.label}
                  onPress={() => !s.disabled && setSlot(i)}
                  style={[styles.slot, s.disabled ? styles.slotDisabled : sel ? styles.slotSel : styles.slotUnsel]}
                >
                  <Text style={[styles.slotText, s.disabled ? styles.slotTextDisabled : sel ? styles.slotTextSel : styles.slotTextUnsel]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Reviews */}
          <Text style={[styles.h3, { marginTop: 26 }]}>Verified reviews</Text>
          <View style={[styles.row, { gap: 12, marginBottom: 14 }]}>
            <Text style={styles.reviewBig}>{partner.rating}</Text>
            <View>
              <Stars value={5} size={14} />
              <Text style={styles.reviewCount}>326 verified reviews</Text>
            </View>
          </View>
          {partnerReviews.map((rv, i) => (
            <View key={i} style={styles.reviewCard}>
              <View style={[styles.row, { gap: 8 }]}>
                <Text style={styles.reviewer}>{rv.name}</Text>
                <View style={styles.verified}>
                  <Feather name="check" size={10} color={colors.good} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
                <Text style={styles.reviewWhen}>{rv.when}</Text>
              </View>
              <View style={{ marginTop: 8 }}><Stars value={rv.stars} size={13} /></View>
              <Text style={styles.reviewText}>{rv.text}</Text>
            </View>
          ))}

          {/* Payment */}
          <Text style={[styles.h3, { marginTop: 26 }]}>Payment method</Text>
          {payMethods.map((m, i) => {
            const sel = i === pay;
            return (
              <Pressable key={m.brand} onPress={() => setPay(i)} style={[styles.payCard, sel ? styles.pkgSel : styles.pkgUnsel]}>
                <View style={styles.payBrand}><Text style={styles.payBrandText}>{m.brand}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payLabel}>{m.label}</Text>
                  <Text style={styles.payNum}>{m.last ? `•••• ${m.last}` : 'Pay from your bank'}</Text>
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
            <Text style={styles.payBarMeta}>{selPkg.name} · {selSlot.label}</Text>
            <Text style={styles.payBarPrice}>{selPkg.price}</Text>
          </View>
          <View style={[styles.row, { gap: 5 }]}>
            <LinearGradient colors={[colors.amber, colors.amber2]} style={styles.miniCoin} />
            <Text style={styles.countsText}>Counts toward R100 voucher</Text>
          </View>
        </View>
        <Pressable style={styles.confirmBtn} onPress={confirm}>
          <Text style={styles.confirmText}>Confirm & Pay {selPkg.price}</Text>
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
  metaText: { color: colors.inkSoft, fontSize: 13, fontFamily: font.body },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.amberTint, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 7 },
  ratingBadgeText: { color: colors.amberInk, fontFamily: font.displayBold, fontSize: 13 },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  vehicleLabel: { fontSize: 11.5, color: colors.inkFaint, fontFamily: font.body },
  vehicleName: { fontFamily: font.display, fontSize: 14, color: colors.ink },
  change: { color: colors.blue, fontSize: 12.5, fontFamily: font.bodySemi },

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
