import Ionicons from "@expo/vector-icons/Ionicons";
import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TILES: { label: string; hint: string; icon: IconName; href: Href }[] = [
  { label: "Gym", hint: "Gym workouts", icon: "barbell-outline", href: "/workouts/equipment" },
  { label: "No kit", hint: "No-equipment workouts", icon: "body-outline", href: "/workouts/no-equipment" },
  { label: "Program", hint: "Open my program", icon: "calendar-outline", href: "/program" },
  { label: "Progress", hint: "Open my progress", icon: "stats-chart-outline", href: "/progress" },
];

/**
 * Four across on most phones; two by two on narrow ones (under 370 pt,
 * e.g. 340-360 wide) or with large text, so labels never get cut off.
 */
export function tileColumns(width: number, fontScale = 1): 2 | 4 {
  return width < 370 || fontScale > 1.25 ? 2 : 4;
}

/** Four shortcuts, like the quick actions in a fitness app's home. */
export function QuickTiles() {
  const { width, fontScale } = useWindowDimensions();
  const columns = tileColumns(width, fontScale);

  return (
    <View style={[styles.tiles, columns === 2 && styles.tilesWrap]} testID={`quick-tiles-${columns}`}>
      {TILES.map((tile) => (
        <Pressable
          key={tile.label}
          onPress={() => router.navigate(tile.href)}
          accessibilityRole="button"
          accessibilityLabel={tile.hint}
          style={({ pressed }) => [columns === 2 ? styles.tileWide : styles.tile, pressed && styles.pressed]}
        >
          <Ionicons name={tile.icon} size={columns === 2 ? 22 : 24} color={colors.gold} />
          <AppText variant="small" numberOfLines={1} style={styles.label}>
            {tile.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const base = {
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surfaceRaised,
} as const;

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", gap: spacing.sm },
  tilesWrap: { flexWrap: "wrap" },
  tile: {
    ...base,
    flex: 1,
    aspectRatio: 1,
    maxHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  // Two per row: the icon beside the label, at least a 48 pt touch target.
  tileWide: {
    ...base,
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: { borderColor: colors.gold },
  label: { color: colors.text, fontWeight: "700", flexShrink: 1 },
});
