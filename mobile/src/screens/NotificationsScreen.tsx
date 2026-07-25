import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, shadow } from '../theme';
import { Loading, ErrorState, EmptyState } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../hooks/useAsync';
import * as api from '../api/endpoints';
import { AppNotification } from '../api/types';
import { relativeDay, timeOf } from '../utils/format';

function iconFor(type: string): keyof typeof Feather.glyphMap {
  const t = type.toLowerCase();
  if (t.includes('booking')) return 'check';
  if (t.includes('voucher') || t.includes('reward')) return 'gift';
  if (t.includes('wash') || t.includes('loyalty')) return 'award';
  if (t.includes('promo') || t.includes('offer')) return 'tag';
  return 'bell';
}

function humanize(type: string): string {
  return type.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/notification/i, '').trim() || 'Notification';
}

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.toDateString() === n.toDateString();
}

function Row({ n }: { n: AppNotification }) {
  const title = n.data?.title || humanize(n.type);
  const body = n.data?.body || n.data?.message || '';
  const unread = !n.read_at;
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: unread ? '#EAF1FF' : '#EEF1F6' }]}>
        <Feather name={iconFor(n.type)} size={19} color={unread ? colors.blue : '#5C6B7D'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!body && <Text style={styles.body}>{body}</Text>}
        <Text style={styles.when}>{isToday(n.created_at) ? timeOf(n.created_at) : relativeDay(n.created_at)}</Text>
      </View>
      {unread ? <View style={styles.unread} /> : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const { token } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.getNotifications(token!), [token]);

  const items = data ?? [];
  const today = items.filter((n) => isToday(n.created_at));
  const earlier = items.filter((n) => !isToday(n.created_at));

  const markAll = async () => {
    try { await api.markAllNotificationsRead(token!); reload(); } catch { /* ignore */ }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Feather name="chevron-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {items.length > 0 && <Pressable onPress={markAll}><Text style={styles.markRead}>Mark all read</Text></Pressable>}
      </View>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="No notifications yet" sub="Booking updates, voucher progress and offers will show up here." />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
          {today.length > 0 && <Text style={styles.section}>TODAY</Text>}
          {today.map((n) => <Row key={n.id} n={n} />)}
          {earlier.length > 0 && <Text style={[styles.section, today.length ? { marginTop: 20 } : null]}>EARLIER</Text>}
          {earlier.map((n) => <Row key={n.id} n={n} />)}
        </ScrollView>
      )}
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
  title: { fontFamily: font.display, fontSize: 14, color: colors.ink },
  body: { color: colors.inkSoft, fontSize: 12.5, marginTop: 3, lineHeight: 18, fontFamily: font.body },
  when: { color: '#A6B0BC', fontSize: 11, marginTop: 6, fontFamily: font.body },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue, marginTop: 4 },
});
