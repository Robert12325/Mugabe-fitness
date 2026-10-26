import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/theme";
import { AppText } from "./AppText";

/** A feature whose real content arrives in a later phase. */
export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.tile}>
        <Ionicons name={icon} size={22} color={colors.gold} />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="small" tone="secondary">
          {description}
        </AppText>
      </View>
      <View style={styles.soon}>
        <AppText variant="small" tone="gold" style={styles.soonText}>
          Soon
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  soon: {
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  soonText: { fontSize: 11, lineHeight: 15, fontWeight: "700" },
});
