import Ionicons from "@expo/vector-icons/Ionicons";
import * as Updates from "expo-updates";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { colors, radius, spacing } from "@/theme";
import { newVersionLink } from "./links";
import { useRelease } from "./ReleaseProvider";

/**
 * The two optional update notices, shown on Home only, so they never cover
 * a form the member is filling in:
 *
 * - "Update ready": expo-updates downloaded an update in the background at
 *   launch. It applies by itself next time the app starts; "Restart now"
 *   applies it straight away, and only when the member taps it.
 * - "New version available": the website lists a newer APK. Installing it
 *   is the member's choice.
 *
 * Either can be put off with "Later" until the app next starts.
 */
export function UpdateNotices() {
  const { info, status } = useRelease();
  const { isUpdatePending } = Updates.useUpdates();
  const [laterOta, setLaterOta] = useState(false);
  const [laterBinary, setLaterBinary] = useState(false);
  const [restartFailed, setRestartFailed] = useState(false);

  const showOta = info.distribution !== null && isUpdatePending && !laterOta;
  const showBinary = status.kind === "available" && !laterBinary;
  const link = newVersionLink(info.distribution);

  if (!showOta && !showBinary) return null;

  return (
    <View style={styles.list}>
      {showOta ? (
        <Notice
          icon="sparkles-outline"
          title="Update ready"
          message={
            restartFailed
              ? "The app couldn't restart itself. Close it and open it again to finish updating."
              : "Restart the app to finish updating. It only takes a moment."
          }
          testID="notice-update-ready"
        >
          <Button
            label="Restart now"
            onPress={() => void Updates.reloadAsync().catch(() => setRestartFailed(true))}
            testID="notice-update-restart"
          />
          <Button label="Later" variant="ghost" onPress={() => setLaterOta(true)} />
        </Notice>
      ) : null}

      {showBinary ? (
        <Notice
          icon="download-outline"
          title="New version available"
          message={
            link
              ? "A newer version of the app is ready. Installing it over this one keeps your sign-in and your log."
              : "A newer staging build is on its Expo build page."
          }
          testID="notice-new-version"
        >
          {link ? (
            <Button
              label="Get it"
              onPress={() => void Linking.openURL(link.url).catch(() => undefined)}
              testID="notice-new-version-get"
            />
          ) : null}
          <Button label="Later" variant="ghost" onPress={() => setLaterBinary(true)} />
        </Notice>
      ) : null}
    </View>
  );
}

function Notice({
  icon,
  title,
  message,
  testID,
  children,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  message: string;
  testID: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.notice} testID={testID} accessibilityRole="summary">
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={20} color={colors.gold} />
        </View>
        <View style={styles.text}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="small" tone="secondary">
            {message}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  notice: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#100d05",
  },
  top: { flexDirection: "row", gap: spacing.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  actions: { gap: spacing.xs },
});
