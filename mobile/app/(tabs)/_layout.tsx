import { Tabs } from "expo-router";
import { Home, Gift, Briefcase, LineChart } from "lucide-react-native";
import { colors, fonts } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.placeholderText2,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.greyBorderLight2,
          height: 84,
          paddingTop: 10,
          paddingBottom: 22,
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
