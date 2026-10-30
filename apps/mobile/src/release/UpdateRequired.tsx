import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { colors, radius, spacing } from "@/theme";
import { newVersionLink } from "./links";
import { useRelease } from "./ReleaseProvider";

/**
 * Shows the app, or, when this build is below the minimum the website
 * names, a screen asking for the new version instead. Only a deliberate
 * change to the release manifest can do that; offline or failed checks
 * never block.
 */
export function ReleaseGate({ children }: { children: ReactNode }) {
  const { status } = useRelease();

  return status.kind === "required" ? <UpdateRequired /> : <>{children}</>;
}

function UpdateRequired() {
  const { info, recheck } = useRelease();
  const link = newVersionLink(info.distribution);
  const staging = info.distribution?.track === "staging";

  return (
    <Screen edges={["top", "bottom", "left", "right"]} testID="screen-update-required">
      <StatusBar style="light" />
      <View style={styles.body}>
        <View style={styles.icon}>
          <Ionicons name="arrow-up-circle-outline" size={44} color={colors.gold} />
        </View>
        <AppText variant="eyebrow" tone="gold">
          New version needed
        </AppText>
        <AppText variant="title" accessibilityRole="header" style={styles.center}>
          Update required
        </AppText>
        <AppText tone="secondary" style={styles.center}>
          This version of Mugabe Fitness is no longer supported. Install the latest version to keep using the app.
          Your account and your daily log are kept and will be there when you open the new version.
        </AppText>
        {staging ? (
          <AppText tone="secondary" style={styles.center}>
            This is the staging app: install the newest staging build from its Expo build page.
          </AppText>
        ) : null}
      </View>

      <View style={styles.actions}>
        {link ? (
          <Button label={link.label} onPress={() => void Linking.openURL(link.url).catch(() => undefined)} testID="update-required-get" />
        ) : null}
        <Button label="Check again" variant="outline" onPress={recheck} testID="update-required-recheck" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  icon: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  center: { textAlign: "center" },
  actions: { gap: spacing.md },
});
