import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
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
}: {
  children: ReactNode;
  edges?: Edge[];
  testID?: string;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={edges} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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
