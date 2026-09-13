import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  count?: number;
  gap?: number;
}

/** Interactive (or read-only, when onChange is omitted) star rating row. */
export function StarRow({ value, onChange, size = 20, count = 5, gap = 5 }: Props) {
  return (
    <View style={[styles.row, { gap }]}>
      {Array.from({ length: count }).map((_, i) => {
        const filled = i < value;
        const star = (
          <Star
            size={size}
            color={colors.gold}
            fill={filled ? colors.gold : "transparent"}
            strokeWidth={filled ? 0 : 1.6}
          />
        );
        if (!onChange) return <View key={i}>{star}</View>;
        return (
          <Pressable key={i} onPress={() => onChange(i + 1)} hitSlop={4}>
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
});
