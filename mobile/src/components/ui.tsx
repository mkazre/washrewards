import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp, ActivityIndicator, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, shadow, font } from '../theme';

const STAR = 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

export function Star({ size = 14, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={STAR} fill={filled ? colors.amber : '#DCE1E8'} />
    </Svg>
  );
}

export function Stars({ value, size = 14, gap = 2 }: { value: number; size?: number; gap?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} filled={value >= n} />
      ))}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({ children, bg, color, style }: { children: React.ReactNode; bg: string; color: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <Text style={[styles.pillText, { color }]}>{children}</Text>
    </View>
  );
}

/** Section heading (Space Grotesk 600) used across screens */
export function H3({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h3, style]}>{children}</Text>;
}

export function Loading({ dark = false }: { dark?: boolean }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={dark ? '#fff' : colors.blue} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errText}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub && <Text style={styles.emptySub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    ...shadow.soft,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontFamily: font.display,
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  h3: {
    fontFamily: font.display,
    fontSize: 16,
    color: colors.ink,
  },
  center: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', fontFamily: font.body, paddingHorizontal: 24 },
  retry: { backgroundColor: colors.blue, borderRadius: radius.sm, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: '#fff', fontFamily: font.display, fontSize: 13.5 },
  emptyTitle: { color: colors.ink, fontFamily: font.display, fontSize: 15 },
  emptySub: { color: colors.inkFaint, fontSize: 13, fontFamily: font.body, textAlign: 'center', paddingHorizontal: 24 },
});
