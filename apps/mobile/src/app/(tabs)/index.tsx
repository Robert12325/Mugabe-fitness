import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { SessionNotice } from "@/components/SessionNotice";
import { colors, radius, spacing } from "@/theme";

// The four promises from the website's hero.
const PILLARS: { icon: React.ComponentProps<typeof Ionicons>["name"]; top: string; bottom: string }[] = [
  { icon: "person", top: "Personalized", bottom: "Coaching" },
  { icon: "trophy", top: "Real", bottom: "Results" },
  { icon: "trending-up", top: "Sustainable", bottom: "Progress" },
  { icon: "flash", top: "Stronger", bottom: "You" },
];

export default function HomeScreen() {
  const { state } = useAuth();

  return (
    <Screen testID="screen-home">
      <BrandMark />

      <View style={styles.hero}>
        <Image
          source={require("../../../assets/coach.jpg")}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel="Your coach at Mugabe Fitness"
        />
        {/* Darkens the photo's lower half so the headline stays legible. */}
        <View style={styles.shade} />

        <View style={styles.heroText}>
          <AppText variant="eyebrow" tone="gold">
            Personal coaching
          </AppText>
          <AppText variant="display" accessibilityRole="header">
            BECOME{"\n"}
            <AppText variant="display" tone="gold">
              STRONGER.
            </AppText>
          </AppText>
        </View>
      </View>

      <AppText tone="secondary">
        Personal coaching built to help you train with purpose, build strength,
        transform your physique, and become the strongest version of yourself.
      </AppText>

      <SessionNotice />

      <AccountCard />

      <View style={styles.pillars}>
        {PILLARS.map((pillar) => (
          <View key={pillar.top} style={styles.pillar}>
            <Ionicons name={pillar.icon} size={20} color={colors.gold} />
            <AppText variant="small" tone="secondary" style={styles.pillarText}>
              {pillar.top}
              {"\n"}
              <AppText variant="small" style={styles.pillarStrong}>
                {pillar.bottom}
              </AppText>
            </AppText>
          </View>
        ))}
      </View>

      {state.status === "restoring" && (
        <ActivityIndicator color={colors.gold} accessibilityLabel="Checking your session" />
      )}
    </Screen>
  );
}

/** Sign in or register when signed out; a welcome when signed in. */
function AccountCard() {
  const { state } = useAuth();

  if (state.status === "restoring") return null;

  if (state.status === "signedIn") {
    const first = state.account.user.name.split(" ")[0] || "there";

    return (
      <Card highlight testID="card-welcome">
        <AppText variant="eyebrow" tone="gold">
          Welcome back
        </AppText>
        <AppText variant="heading">Hi, {first}</AppText>
        <AppText tone="secondary">
          Your workouts, program and progress will live here as the app grows.
        </AppText>
        <Button label="View my program" variant="outline" onPress={() => router.navigate("/program")} />
      </Card>
    );
  }

  if (state.status === "unverified") return null;

  return (
    <Card highlight testID="card-get-started">
      <AppText variant="heading">Start your transformation</AppText>
      <AppText tone="secondary">
        Sign in with the account you use on the Mugabe Fitness website, or
        create one.
      </AppText>
      <Button label="Sign in" onPress={() => router.push("/sign-in")} testID="home-sign-in" />
      <Button
        label="Create account"
        variant="outline"
        onPress={() => router.push("/register")}
        testID="home-register"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 360,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Spelled out: React Native 0.88 removed StyleSheet.absoluteFillObject.
  photo: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  shade: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(5,5,5,0.72)",
  },
  heroText: { position: "absolute", left: spacing.xl, right: spacing.xl, bottom: spacing.xl, gap: spacing.sm },
  pillars: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  pillar: {
    flexGrow: 1,
    flexBasis: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillarText: { flexShrink: 1 },
  pillarStrong: { color: colors.text, fontWeight: "700" },
});
