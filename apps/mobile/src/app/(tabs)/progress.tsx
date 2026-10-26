import Ionicons from "@expo/vector-icons/Ionicons";
import { Linking, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Glow } from "@/components/Glow";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { SignedOutPrompt } from "@/components/SignedOutPrompt";
import { apiConfig } from "@/config/env";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** The website's account page, where members log their days today. */
const WEBSITE_TRACKING = apiConfig.ok ? `${apiConfig.baseUrl}/account` : null;

// What the website's tracking already does, and the app will.
const COMING: { icon: IconName; title: string; text: string }[] = [
  { icon: "restaurant-outline", title: "Daily log", text: "Calories, protein and water against your coach's targets." },
  { icon: "trending-down-outline", title: "Weigh-ins", text: "Your weight over time, as a trend line." },
  { icon: "flag-outline", title: "Coach's targets", text: "The goals your coach sets for you, in one place." },
];

/**
 * Placeholder for the daily log and weight tracking the website offers.
 * Shows no numbers until real ones exist.
 */
export default function ProgressScreen() {
  const { state } = useAuth();

  return (
    <Screen testID="screen-progress">
      <PageHeader eyebrow="Track" title="Progress" />

      {state.status === "signedIn" ? (
        <>
          <View style={styles.hero}>
            <Glow size={190} />
            <View style={styles.icon}>
              <Ionicons name="stats-chart" size={26} color={colors.gold} />
            </View>
            <AppText variant="eyebrow" tone="gold">
              Coming to the app
            </AppText>
            <AppText variant="title">Your progress, in your pocket</AppText>
            <AppText tone="secondary">
              Until it arrives here, keep logging on the website: everything you enter there will appear in the app.
            </AppText>
            {WEBSITE_TRACKING ? (
              <Button
                label="Track on the website"
                onPress={() => Linking.openURL(WEBSITE_TRACKING)}
                testID="progress-open-website"
              />
            ) : null}
          </View>

          <AppText variant="heading" accessibilityRole="header">
            What&apos;s coming
          </AppText>

          {COMING.map((item) => (
            <View key={item.title} style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name={item.icon} size={22} color={colors.gold} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">{item.title}</AppText>
                <AppText variant="small" tone="secondary">
                  {item.text}
                </AppText>
              </View>
              <View style={styles.soon}>
                <AppText variant="small" tone="gold" style={styles.soonText}>
                  Soon
                </AppText>
              </View>
            </View>
          ))}
        </>
      ) : (
        <SignedOutPrompt message="Sign in to track your progress." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#100d05",
    overflow: "hidden",
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  soon: {
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  soonText: { fontSize: 11, lineHeight: 15, fontWeight: "700" },
});
