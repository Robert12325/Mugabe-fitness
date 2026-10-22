import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radius, spacing } from "@/theme";
import { AppText } from "./AppText";

/** A labelled input with its error shown directly underneath. */
export function TextField({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <AppText variant="eyebrow" tone="secondary" nativeID={`${label}-label`}>
        {label}
      </AppText>

      <TextInput
        {...props}
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
        style={[
          styles.input,
          focused && styles.focused,
          Boolean(error) && styles.invalid,
        ]}
      />

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
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16, // 16+ stops iOS zooming into the field
  },
  focused: { borderColor: "rgba(212,175,55,0.7)" },
  invalid: { borderColor: colors.danger },
});
