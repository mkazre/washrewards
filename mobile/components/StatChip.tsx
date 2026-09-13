import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii, shadow } from "@/lib/theme";

interface Props {
  label: string;
  value: string;
  delta?: string;
  deltaColor?: string;
}

export function StatChip({ label, value, delta, deltaColor = colors.green }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {delta ? (
        <Text style={[styles.delta, { color: deltaColor }]}>{delta}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.greyBorderLight,
    borderRadius: radii.xl,
    padding: 16,
    ...shadow.card,
  },
  label: { color: colors.greyText2, fontSize: 12, fontFamily: fonts.body },
  value: {
    fontFamily: fonts.heading,
    fontSize: 26,
    marginTop: 4,
    color: colors.navyDeep,
  },
  delta: { fontSize: 12, fontFamily: fonts.bodySemi, marginTop: 2 },
});
