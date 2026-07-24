import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, shadow } from '../theme';

type Item = {
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  gradient?: boolean;
  title: string;
  body: string;
  when: string;
  unread?: boolean;
};

const today: Item[] = [
  { icon: 'check', iconBg: '#EAF1FF', iconColor: colors.blue, title: 'Booking confirmed', body: 'Full Valet at Sparkle & Shine is booked for today, 14:00.', when: '2 min ago', unread: true },
  { icon: 'award', iconBg: '', iconColor: '', gradient: true, title: 'Wash counted', body: 'Your Full Valet counts toward your next R100 voucher — 3 of 5 washes done.', when: '2 min ago', unread: true },
  { icon: 'gift', iconBg: '#FEF3DC', iconColor: '#B45309', title: 'R100 voucher ready', body: 'You have a R100 voucher ready to redeem at any participating partner.', when: '1 hour ago' },
];

const earlier: Item[] = [
  { icon: 'star', iconBg: '#EEF1F6', iconColor: colors.amber, title: 'Almost there!', body: "Two more paid washes and you'll earn another R100 voucher.", when: 'Mon' },
  { icon: 'tag', iconBg: '#EAF1FF', iconColor: colors.blue, title: 'Weekend offer', body: 'AquaJet Auto Spa: 20% off all packages this weekend only.', when: 'Sun' },
];

function Row({ item }: { item: Item }) {
  return (
    <View style={styles.card}>
      {item.gradient ? (
        <LinearGradient colors={['#FEF3DC', '#FDE9BE']} style={styles.icon}>
          <LinearGradient colors={[colors.amber, colors.amber2]} style={styles.coin} />
        </LinearGradient>
      ) : (
        <View style={[styles.icon, { backgroundColor: item.iconBg }]}>
          <Feather name={item.icon} size={19} color={item.iconColor} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.when}>{item.when}</Text>
      </View>
      {item.unread ? <View style={styles.unread} /> : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Feather name="chevron-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.markRead}>Mark all read</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
        <Text style={styles.section}>TODAY</Text>
        {today.map((it, i) => <Row key={i} item={it} />)}
        <Text style={[styles.section, { marginTop: 20 }]}>EARLIER THIS WEEK</Text>
        {earlier.map((it, i) => <Row key={i} item={it} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontFamily: font.display, fontSize: 19 },
  markRead: { color: '#7E9BE0', fontSize: 12.5, fontFamily: font.bodySemi },

  section: { fontFamily: font.display, fontSize: 12, letterSpacing: 0.5, color: colors.inkFaint, marginBottom: 10 },
  card: { flexDirection: 'row', gap: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, marginBottom: 10, ...shadow.soft },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  coin: { width: 18, height: 18, borderRadius: 9 },
  title: { fontFamily: font.display, fontSize: 14, color: colors.ink },
  body: { color: colors.inkSoft, fontSize: 12.5, marginTop: 3, lineHeight: 18, fontFamily: font.body },
  when: { color: '#A6B0BC', fontSize: 11, marginTop: 6, fontFamily: font.body },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue, marginTop: 4 },
});
