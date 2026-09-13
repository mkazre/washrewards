import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { colors, fonts, radii } from "@/lib/theme";
import { PillButton } from "./PillButton";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = "We couldn't reach WashRewards. Check your connection and try again.",
  onRetry,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <AlertTriangle size={26} color={colors.amberText2} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={{ marginTop: 16, width: "100%" }}>
          <PillButton label="Try again" onPress={onRetry} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.amberBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.headingSemi,
    fontSize: 15,
    marginTop: 14,
    color: colors.navyDeep,
  },
  message: {
    color: colors.greyText,
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  emptyWrap: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.dashedBorder,
    borderRadius: radii.lg,
    padding: 22,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 13.5,
    color: colors.greyText2,
    textAlign: "center",
  },
  emptyMessage: {
    color: colors.greyText2,
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
