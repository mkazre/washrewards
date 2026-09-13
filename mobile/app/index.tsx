import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAppState } from "@/lib/AppState";
import { colors } from "@/lib/theme";

export default function Index() {
  const { token, authLoading } = useAppState();

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.navy,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return <Redirect href={token ? "/(tabs)/home" : "/(auth)/splash"} />;
}
