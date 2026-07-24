import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { colors, font, radius, shadow } from '../theme';
import { Card, Star } from '../components/ui';
import { lastWash, ratingCats } from '../data/mock';
import { useToast } from '../components/Toast';

export default function RatingScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const toast = useToast();
  const [stars, setStars] = useState(0);
  const [cats, setCats] = useState<Record<string, number>>({});
  const [review, setReview] = useState('');

  const canSubmit = stars > 0;
  const submit = () => {
    if (!canSubmit) return;
    toast('Review submitted · Verified');
    nav.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Feather name="chevron-left" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Rate your wash</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 28 }}>
        <Card style={styles.summary}>
          <Text style={styles.pkg}>{lastWash.pkg}</Text>
          <Text style={styles.partner}>{lastWash.partner}</Text>
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
          {ratingCats.map((c, i) => (
            <View key={c} style={[styles.catRow, i === ratingCats.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.catName}>{c}</Text>
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setCats((s) => ({ ...s, [c]: n }))}>
                    <Star size={20} filled={(cats[c] || 0) >= n} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </Card>

        <Text style={styles.h3}>Add a review <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          value={review}
          onChangeText={setReview}
          placeholder="Share what stood out about your wash…"
          placeholderTextColor={colors.inkMute}
          multiline
          style={styles.textarea}
        />

        <Pressable style={[styles.submitBtn, canSubmit ? styles.submitOn : styles.submitOff]} onPress={submit}>
          <Text style={styles.submitText}>Submit review</Text>
        </Pressable>
        <Text style={styles.footnote}>Only customers who completed a paid wash can review.</Text>
      </ScrollView>
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
