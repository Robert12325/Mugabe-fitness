import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { Screen } from "./Screen";

/** A form page that keeps its fields above the keyboard. */
export function FormScreen({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen edges={["left", "right", "bottom"]} testID={testID}>
        {children}
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** The raised panel a form's fields and submit button sit in. */
export const formStyles = StyleSheet.create({
  panel: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
});

const styles = StyleSheet.create({ flex: { flex: 1 } });
