import { StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { apiConfig } from "@/config/env";
import { colors, radius, spacing } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

/**
 * Explains, in one place, anything that stands between the user and their
 * account: a misconfigured build, a server that can't be reached, or a
 * session the server ended. Renders nothing when all is well.
 */
export function SessionNotice() {
  const { state, refresh } = useAuth();

  if (!apiConfig.ok) {
    return (
      <Notice tone="danger" title="App not configured" testID="notice-config">
        {apiConfig.problem}
      </Notice>
    );
  }

  if (state.status === "unverified") {
    return (
      <Notice tone="warning" title="Can't reach Mugabe Fitness" testID="notice-unverified">
        {state.failure.message}
        <View style={styles.action}>
          <Button label="Try again" variant="outline" onPress={() => void refresh()} />
        </View>
      </Notice>
    );
  }

  if (state.status === "signedOut" && state.notice === "expired") {
    return (
      <Notice tone="warning" title="You've been signed out" testID="notice-expired">
        Your session ended. Please sign in again.
      </Notice>
    );
  }

  return null;
}

function Notice({
  tone,
  title,
  children,
  testID,
}: {
  tone: "warning" | "danger";
  title: string;
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[styles.box, tone === "danger" ? styles.danger : styles.warning]}
    >
      <AppText variant="bodyStrong" tone={tone === "danger" ? "danger" : "default"}>
        {title}
      </AppText>
      <AppText variant="small" tone="secondary">
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, borderWidth: 1, padding: spacing.lg, gap: spacing.xs },
  warning: { borderColor: "rgba(243,207,115,0.35)", backgroundColor: "rgba(243,207,115,0.07)" },
  danger: { borderColor: "rgba(240,146,140,0.4)", backgroundColor: colors.dangerTint },
  action: { marginTop: spacing.md },
});
