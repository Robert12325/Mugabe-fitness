import { Stack } from "expo-router";
import { colors, fonts } from "@/theme";

/** The Workouts tab: choose a mode, a body part, then an exercise. */
export default function WorkoutsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.gold,
        headerTitleStyle: { fontFamily: fonts.heavy, color: colors.text },
        headerShadowVisible: false,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[mode]/index" options={{ title: "" }} />
      <Stack.Screen name="[mode]/[category]" options={{ title: "" }} />
      <Stack.Screen name="[mode]/exercises/[slug]" options={{ title: "" }} />
    </Stack>
  );
}
