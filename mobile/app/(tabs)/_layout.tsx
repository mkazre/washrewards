import { Tabs } from "expo-router";
import { Home, Gift, Briefcase, LineChart } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/lib/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.placeholderText2,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.greyBorderLight2,
          height: 62 + insets.bottom,
          paddingTop: 10,
          paddingBottom: Math.max(10, insets.bottom),
        },
        tabBarLabelStyle: {
          fontFamily: fonts.headingSemi,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Home size={size ?? 23} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color, size }) => (
            <Gift size={size ?? 23} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="partner"
        options={{
          title: "Partner",
          tabBarIcon: ({ color, size }) => (
            <Briefcase size={size ?? 23} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="platform"
        options={{
          title: "Platform",
          tabBarIcon: ({ color, size }) => (
            <LineChart size={size ?? 23} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
