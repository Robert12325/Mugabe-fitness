import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme";
import { AppText } from "./AppText";
import { Card } from "./Card";

/** A tab whose real content arrives in a later phase. */
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
    <Card>
      <View style={styles.tile}>
        <Ionicons name={icon} size={24} color={colors.gold} />
      </View>
      <AppText variant="eyebrow" tone="gold">
        Coming soon
      </AppText>
      <AppText variant="heading">{title}</AppText>
      <AppText tone="secondary">{description}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },
});
