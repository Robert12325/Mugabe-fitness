import { Image, StyleSheet, View } from "react-native";
import { colors, fonts } from "@/theme";
import { AppText } from "./AppText";

/**
 * The "M" monogram beside the MUGABE / FITNESS wordmark, as in the
 * website's header. The mark is rendered from the website's own vector
 * (`src/components/brand-mark.tsx`) into `assets/brand-mark.png`.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mugabe Fitness"
    >
      <Image
        source={require("../../assets/brand-mark.png")}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />

      <View>
        <AppText style={[styles.name, { fontSize: size * 0.5 }]}>MUGABE</AppText>
        <AppText style={[styles.suffix, { fontSize: size * 0.24 }]}>FITNESS</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontFamily: fonts.heavy, color: colors.text, letterSpacing: 1.6 },
  suffix: { fontFamily: fonts.bold, color: colors.gold, letterSpacing: 5, marginTop: 2 },
});
