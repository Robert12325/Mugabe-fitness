import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radius, spacing } from "@/theme";
import { AppText } from "./AppText";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * A labelled input with its error shown directly underneath, an optional
 * icon, and a show/hide button on password fields.
 */
export function TextField({
  label,
  error,
  icon,
  ...props
}: TextInputProps & { label: string; error?: string; icon?: IconName }) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const secret = Boolean(props.secureTextEntry);

  return (
    <View style={styles.wrap}>
      <AppText variant="eyebrow" tone="secondary" nativeID={`${label}-label`}>
        {label}
      </AppText>

      <View style={[styles.field, focused && styles.focused, Boolean(error) && styles.invalid]}>
        {icon ? <Ionicons name={icon} size={18} color={focused ? colors.gold : colors.textMuted} /> : null}

        <TextInput
          {...props}
          secureTextEntry={secret && !revealed}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.gold}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          style={styles.input}
        />

        {secret ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            hitSlop={10}
          >
            <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <AppText variant="small" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  field: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    minHeight: 52,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16, // 16+ stops iOS zooming into the field
    paddingVertical: 0,
  },
  focused: { borderColor: "rgba(212,175,55,0.7)", backgroundColor: "rgba(212,175,55,0.05)" },
  invalid: { borderColor: colors.danger },
});
