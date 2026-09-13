import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts, radii, shadow } from "@/lib/theme";

type Variant = "primary" | "accent" | "dark" | "outline" | "ghost";

interface Props {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function PillButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  fullWidth = true,
}: Props) {
  const palette = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        fullWidth && { width: "100%" },
        palette.container,
        variant === "primary" && shadow.button,
        (disabled || loading) && { opacity: 0.6 },
        pressed && !disabled && { transform: [{ translateY: 1 }] },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.text.color as string} />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, palette.text]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const variantStyles: Record<
  Variant,
  { container: object; text: { color: string } }
> = {
  primary: {
    container: { backgroundColor: colors.blue },
    text: { color: colors.white },
  },
  accent: {
    container: { backgroundColor: colors.gold },
    text: { color: colors.navy },
  },
  dark: {
    container: { backgroundColor: colors.navy },
    text: { color: colors.white },
  },
  outline: {
    container: {
      backgroundColor: colors.white,
      borderWidth: 1.5,
      borderColor: colors.greyBorder,
    },
    text: { color: colors.navyDeep },
  },
  ghost: {
    container: { backgroundColor: colors.chipBlueBg },
    text: { color: colors.blue },
  },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: 17,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  label: {
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    fontWeight: "600",
  },
});
