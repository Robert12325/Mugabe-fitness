import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { colors, fonts } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    // The tab bar passes the tint as a ColorValue; ours are always strings.
    return (
      <Ionicons
        name={name}
        size={size}
        color={typeof color === "string" ? color : colors.textMuted}
      />
    );
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="workouts" options={{ title: "Workouts", tabBarIcon: icon("barbell") }} />
      <Tabs.Screen name="program" options={{ title: "My Program", tabBarIcon: icon("calendar") }} />
      <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: icon("stats-chart") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person") }} />
    </Tabs>
  );
}
