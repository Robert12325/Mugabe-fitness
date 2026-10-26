import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { AppText } from "./AppText";

type Variant = "gold" | "outline" | "ghost" | "danger";

/**
 * The app's one button. `loading` keeps the label's width, disables
 * presses and tells screen readers it is busy.
 */
export function Button({
  label,
  onPress,
  variant = "gold",
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  testID?: string;
}) {
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !inactive && styles.pressed,
        inactive && styles.inactive,
      ]}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === "gold" ? colors.onGold : variant === "danger" ? colors.danger : colors.gold}
          />
        )}
        <AppText variant="button" tone={variant === "gold" ? "onGold" : variant === "danger" ? "danger" : "gold"}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52, // comfortably above the 44pt minimum touch target
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  gold: { backgroundColor: colors.gold },
  outline: { borderWidth: 1, borderColor: colors.gold, backgroundColor: "transparent" },
  ghost: { backgroundColor: "transparent" },
  danger: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.dangerTint },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  inactive: { opacity: 0.5 },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
