import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { colors, radii, shadow } from "@/lib/theme";

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    padding: 16,
    ...shadow.card,
  },
});
