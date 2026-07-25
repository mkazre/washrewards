import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, font, radius, shadow } from '../theme';
import { Card } from '../components/ui';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const p = useRoute<RouteProp<RootStackParamList, 'Confirmation'>>().params;

  const Line = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24, paddingHorizontal: 28, alignItems: 'center' }}
      >
        <View style={styles.checkWrap}>
          <View style={styles.checkRing} />
          <Feather name="check" size={44} color={colors.blue} />
        </View>
        <Text style={styles.title}>Payment successful</Text>
        <Text style={styles.subtitle}>Your wash is booked and paid. A digital receipt has been saved to your app.</Text>

        <Card style={styles.receipt}>
          <View style={styles.receiptHead}>
            <Text style={styles.receiptTitle}>Digital receipt</Text>
            <Text style={styles.receiptNo}>#{p.receiptNo}</Text>
          </View>
          <Line label="Partner" value={p.partnerName} />
          <Line label="Vehicle" value={p.vehicleName} />
          <Line label="Package" value={p.serviceName} />
          <Line label="When" value={p.scheduledLabel} />
          <Line label="Paid via" value={p.payLabel} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount paid</Text>
            <Text style={styles.totalValue}>{p.amount}</Text>
          </View>
        </Card>

        <View style={styles.washNote}>
          <View style={styles.rCoin}><Text style={styles.rCoinText}>R</Text></View>
          <Text style={styles.washNoteText}>
            {p.voucherEarned ? (
              <><Text style={{ fontFamily: font.display }}>You earned a voucher! 🎉</Text> It's ready to redeem in your Rewards wallet.</>
            ) : (
              <><Text style={{ fontFamily: font.display }}>Wash {p.washCount} of {p.threshold} complete.</Text> Reach {p.threshold} paid washes to earn your next voucher.</>
            )}
          </Text>
        </View>

        <Pressable style={styles.doneBtn} onPress={() => nav.navigate('Tabs')}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  checkWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EAF1FF', alignItems: 'center', justifyContent: 'center' },
  checkRing: { position: 'absolute', top: -7, left: -7, right: -7, bottom: -7, borderRadius: 55, borderWidth: 3, borderColor: colors.amber, opacity: 0.35 },
  title: { marginTop: 24, fontFamily: font.displayBold, fontSize: 23, color: colors.ink },
  subtitle: { marginTop: 8, color: colors.inkSoft, fontSize: 14, textAlign: 'center', maxWidth: 252, lineHeight: 21, fontFamily: font.body },

  receipt: { width: '100%', marginTop: 24, padding: 18 },
  receiptHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: '#DCE2EA' },
  receiptTitle: { fontFamily: font.display, fontSize: 13, color: colors.ink },
  receiptNo: { color: colors.inkFaint, fontSize: 12, fontFamily: font.display },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  lineLabel: { color: colors.inkFaint, fontSize: 13, fontFamily: font.body },
  lineValue: { fontFamily: font.display, fontSize: 13.5, color: colors.ink },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: colors.line3 },
  totalLabel: { fontFamily: font.display, fontSize: 14, color: colors.ink },
  totalValue: { fontFamily: font.displayBold, fontSize: 18, color: colors.blue },

  washNote: { width: '100%', marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.amberTint, borderWidth: 1, borderColor: '#F4E3BE', borderRadius: radius.md, paddingHorizontal: 15, paddingVertical: 13 },
  rCoin: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  rCoinText: { color: colors.navy, fontFamily: font.displayBold, fontSize: 12 },
  washNoteText: { flex: 1, fontSize: 12.5, color: '#7A5A1E', lineHeight: 18, fontFamily: font.body },

  doneBtn: { width: '100%', marginTop: 18, backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 17, alignItems: 'center', ...shadow.blue },
  doneText: { color: '#fff', fontSize: 16, fontFamily: font.display },
});
