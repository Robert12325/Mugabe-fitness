import { DIFFICULTY_NAMES, type Difficulty } from "@mugabe/fitness-content";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { radius, spacing } from "@/theme";
import { DIFFICULTY_COLORS } from "./look";

/** "Beginner" in green, "Intermediate" in gold, "Advanced" in red. */
export function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  const color = DIFFICULTY_COLORS[difficulty];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <AppText variant="small" style={[styles.text, { color }]}>
        {DIFFICULTY_NAMES[difficulty]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: "flex-start", borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  text: { fontSize: 11, lineHeight: 15, fontWeight: "700" },
});
