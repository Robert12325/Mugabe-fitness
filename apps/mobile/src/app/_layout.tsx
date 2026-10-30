// One import per weight: the package index would bundle all 18 weights
// (about 6 MB of fonts) into the app.
import { Montserrat_500Medium } from "@expo-google-fonts/montserrat/500Medium";
import { Montserrat_600SemiBold } from "@expo-google-fonts/montserrat/600SemiBold";
import { Montserrat_700Bold } from "@expo-google-fonts/montserrat/700Bold";
import { Montserrat_800ExtraBold } from "@expo-google-fonts/montserrat/800ExtraBold";
import { Montserrat_900Black } from "@expo-google-fonts/montserrat/900Black";
import { Montserrat_900Black_Italic } from "@expo-google-fonts/montserrat/900Black_Italic";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/auth/AuthProvider";
import { DailyProvider } from "@/daily/DailyProvider";
import { ReleaseProvider } from "@/release/ReleaseProvider";
import { ReleaseGate } from "@/release/UpdateRequired";
import { colors, fonts } from "@/theme";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
    Montserrat_900Black_Italic,
  });

  // A brief black frame while the brand face loads. If it fails to load,
  // carry on with the system font rather than leaving the app blank.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <SafeAreaProvider>
      {/* Outermost, so an "Update required" build shows only that screen. */}
      <ReleaseProvider>
        <ReleaseGate>
          <AuthProvider>
            <DailyProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.background },
                  headerTintColor: colors.gold,
                  headerTitleStyle: { fontFamily: fonts.heavy, color: colors.text },
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="sign-in"
                  options={{ presentation: "modal", title: "Sign in" }}
                />
                <Stack.Screen
                  name="register"
                  options={{ presentation: "modal", title: "Create account" }}
                />
                <Stack.Screen
                  name="log-day"
                  options={{ presentation: "modal", title: "Log your day" }}
                />
                <Stack.Screen
                  name="delete-account"
                  options={{ presentation: "modal", title: "Delete account" }}
                />
              </Stack>
            </DailyProvider>
          </AuthProvider>
        </ReleaseGate>
      </ReleaseProvider>
    </SafeAreaProvider>
  );
}
