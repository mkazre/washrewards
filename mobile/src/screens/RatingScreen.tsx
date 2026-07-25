import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, shadow } from '../theme';
import { Card, Star, Loading, ErrorState, EmptyState } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { useAsync } from '../hooks/useAsync';
import * as api from '../api/endpoints';
import { ApiError } from '../api/client';
import { useToast } from '../components/Toast';

const CATS = [
  { label: 'Cleanliness', key: 'cleanliness_rating' as const },
  { label: 'Staff professionalism', key: 'staff_rating' as const },
  { label: 'Value for money', key: 'value_rating' as const },
  { label: 'Waiting time', key: 'wait_time_rating' as const },
];

export default function RatingScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const toast = useToast();
  const { token } = useAuth();

  const [stars, setStars] = useState(0);
  const [cats, setCats] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(async () => {
    const bookings = await api.getBookings(token!);
    return bookings.find((b) => b.status === 'completed' && b.payment_status === 'paid' && !b.has_review) ?? null;
  }, [token]);

  const submit = async () => {
    if (!data || stars < 1) return;
    setBusy(true);
    try {
      await api.reviewBooking(token!, data.id, {
        rating: stars,
        cleanliness_rating: cats.cleanliness_rating,
        staff_rating: cats.staff_rating,
        value_rating: cats.value_rating,
        wait_time_rating: cats.wait_time_rating,
        comment: comment.trim() || undefined,
      });
      toast('Review submitted · Verified');
      nav.goBack();
    } catch (e) {
      const err = e as ApiError;
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Feather name="chevron-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Rate your wash</Text>
      </View>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <View style={{ padding: 20 }}>
          <Card style={{ padding: 24 }}>
            <EmptyState title="Nothing to review yet" sub="Once a wash is completed and paid, you can leave a verified review here." />
          </Card>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 28 }}>
          <Card style={styles.summary}>
            <Text style={styles.pkg}>{data.service?.name ?? 'Wash'}</Text>
            <Text style={styles.partner}>{data.tenant?.name ?? ''}</Text>
            <View style={styles.verified}>
              <Feather name="check" size={11} color={colors.good} />
              <Text style={styles.verifiedText}>Verified — paid wash completed</Text>
            </View>
            <View style={styles.bigStars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setStars(n)}>
                  <Star size={38} filled={stars >= n} />
                </Pressable>
              ))}
            </View>
            <Text style={styles.tapHint}>Tap to rate your overall experience</Text>
          </Card>

          <Text style={styles.h3}>Rate the details</Text>
          <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            {CATS.map((c, i) => (
              <View key={c.key} style={[styles.catRow, i === CATS.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.catName}>{c.label}</Text>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setCats((s) => ({ ...s, [c.key]: n }))}>
                      <Star size={20} filled={(cats[c.key] || 0) >= n} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </Card>

          <Text style={styles.h3}>Add a review <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share what stood out about your wash…"
            placeholderTextColor={colors.inkMute}
            multiline
            style={styles.textarea}
          />

          <Pressable style={[styles.submitBtn, stars > 0 ? styles.submitOn : styles.submitOff]} onPress={submit} disabled={stars < 1 || busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit review</Text>}
          </Pressable>
          <Text style={styles.footnote}>Only customers who completed a paid wash can review.</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.navy, paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontFamily: font.display, fontSize: 19 },

  summary: { padding: 18, alignItems: 'center' },
  pkg: { fontFamily: font.display, fontSize: 16, color: colors.ink },
  partner: { color: colors.inkSoft, fontSize: 13, marginTop: 3, fontFamily: font.body },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, backgroundColor: colors.goodTint, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { color: colors.good, fontSize: 11, fontFamily: font.display },
  bigStars: { flexDirection: 'row', gap: 10, marginTop: 18, marginBottom: 4 },
  tapHint: { color: colors.inkMute, fontSize: 12, fontFamily: font.body },

  h3: { fontFamily: font.display, fontSize: 15, color: colors.ink, marginTop: 22, marginBottom: 8 },
  optional: { color: colors.inkMute, fontFamily: font.body, fontSize: 12.5 },
  catRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  catName: { fontSize: 13.5, fontFamily: font.displayMed, color: colors.ink },

  textarea: { height: 88, borderWidth: 1, borderColor: colors.line2, borderRadius: radius.md, padding: 13, fontFamily: font.body, fontSize: 13.5, color: colors.ink, backgroundColor: colors.surface, textAlignVertical: 'top' },

  submitBtn: { marginTop: 16, borderRadius: radius.md, paddingVertical: 17, alignItems: 'center' },
  submitOn: { backgroundColor: colors.blue, ...shadow.blue },
  submitOff: { backgroundColor: '#AEC3EE' },
  submitText: { color: '#fff', fontSize: 16, fontFamily: font.display },
  footnote: { textAlign: 'center', color: colors.inkMute, fontSize: 11.5, marginTop: 10, fontFamily: font.body },
});
