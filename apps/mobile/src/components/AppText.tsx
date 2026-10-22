import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, type as typeScale, type TypeVariant } from "@/theme";

type Tone = "default" | "secondary" | "muted" | "gold" | "danger" | "onGold";

const TONES: Record<Tone, string> = {
  default: colors.text,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  gold: colors.gold,
  danger: colors.danger,
  onGold: colors.onGold,
};

/** Every piece of text in the app, so the type scale is set in one place. */
export function AppText({
  variant = "body",
  tone = "default",
  style,
  ...props
}: TextProps & { variant?: TypeVariant; tone?: Tone }) {
  return (
    <Text
      {...props}
      // Respect the user's text size, within a range the layouts survive.
      maxFontSizeMultiplier={1.6}
      style={[typeScale[variant] as TextStyle, { color: TONES[tone] }, style]}
    />
  );
}
