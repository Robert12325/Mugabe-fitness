/**
 * The Mugabe Fitness visual system for the app: the same black and gold as
 * the website (`src/app/globals.css` and the admin's metallic gold), in
 * React Native form.
 */

export const colors = {
  background: "#050505",
  surface: "#0b0b0b",
  surfaceRaised: "#121212",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.18)",

  gold: "#d4af37",
  goldLight: "#f6d27a",
  goldDark: "#b88420",
  goldTint: "rgba(212,175,55,0.12)",
  onGold: "#050505",

  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.68)",
  textMuted: "rgba(255,255,255,0.42)",

  danger: "#f0928c",
  dangerTint: "rgba(192,69,61,0.15)",
  success: "#5cc98a",
  warning: "#f3cf73",
} as const;

/** A 4-point scale, so spacing stays consistent across screens. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/**
 * Montserrat, as on the website. The heavy italic is the display face of
 * the site's hero and headings.
 */
export const fonts = {
  regular: "Montserrat_500Medium",
  medium: "Montserrat_600SemiBold",
  bold: "Montserrat_700Bold",
  heavy: "Montserrat_800ExtraBold",
  black: "Montserrat_900Black",
  blackItalic: "Montserrat_900Black_Italic",
} as const;

export const type = {
  display: { fontFamily: fonts.blackItalic, fontSize: 40, lineHeight: 42, letterSpacing: -0.5 },
  title: { fontFamily: fonts.black, fontSize: 26, lineHeight: 30 },
  heading: { fontFamily: fonts.heavy, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  /** Small capitals with wide tracking: "YOUR ACCOUNT". */
  eyebrow: { fontFamily: fonts.heavy, fontSize: 11, lineHeight: 14, letterSpacing: 2.5, textTransform: "uppercase" },
  button: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 16, letterSpacing: 1.4, textTransform: "uppercase" },
} as const;

export type TypeVariant = keyof typeof type;
