import { Image, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { AppText } from "./AppText";
import { BrandMark } from "./BrandMark";

/** The coach's photo, the brand and a headline at the top of sign-in and registration. */
export function AuthHeader({ title, accent, subtitle }: { title: string; accent: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <Image
          source={require("../../assets/coach.jpg")}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel="Your coach at Mugabe Fitness"
        />
        {/* Darkens the photo towards the bottom, where the brand sits. */}
        <View style={[styles.shade, { top: "35%", opacity: 0.35 }]} />
        <View style={[styles.shade, { top: "55%", opacity: 0.6 }]} />
        <View style={[styles.shade, { top: "75%", opacity: 0.85 }]} />
        <View style={styles.brand}>
          <BrandMark size={32} />
        </View>
      </View>

      <View style={styles.text}>
        <AppText variant="display" accessibilityRole="header">
          {title}
          {"\n"}
          <AppText variant="display" tone="gold">
            {accent}
          </AppText>
        </AppText>
        <AppText tone="secondary">{subtitle}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl },
  banner: {
    height: 190,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: colors.surface,
  },
  photo: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  shade: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.background },
  brand: { position: "absolute", left: spacing.lg, bottom: spacing.lg },
  text: { gap: spacing.sm },
});
