import type { ReactElement, ReactNode } from "react";
import { ScrollView, StyleSheet, type RefreshControlProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

/**
 * A scrolling page on the brand background, kept clear of notches and the
 * home indicator. Tab screens leave the bottom edge to the tab bar.
 */
export function Screen({
  children,
  edges = ["top", "left", "right"],
  testID,
  refreshControl,
}: {
  children: ReactNode;
  edges?: Edge[];
  testID?: string;
  /** Pull-to-refresh, for screens that read from the server. */
  refreshControl?: ReactElement<RefreshControlProps>;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={edges} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
    // Keeps line lengths readable on tablets.
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
});
