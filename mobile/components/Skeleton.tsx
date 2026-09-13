import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radii } from "@/lib/theme";

export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, style, { opacity }]}
      accessibilityLabel="loading"
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton style={{ width: 44, height: 44, borderRadius: radii.md }} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton style={{ width: "70%", height: 14, borderRadius: 6 }} />
        <Skeleton style={{ width: "45%", height: 12, borderRadius: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.greyBg3,
    borderRadius: 8,
  },
  card: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    padding: 14,
    marginBottom: 12,
  },
});
