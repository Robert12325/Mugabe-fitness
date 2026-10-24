import { router, Stack } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";

/**
 * For a link to a mode, category or exercise that doesn't exist, or to an
 * exercise the coach hasn't approved yet. Both read the same, so a draft's
 * address reveals nothing.
 */
export function WorkoutNotFound({ title, testID }: { title: string; testID: string }) {
  return (
    <Screen testID={testID} edges={["left", "right"]}>
      <Stack.Screen options={{ title: "Workouts" }} />
      <Card>
        <AppText variant="heading">{title}</AppText>
        <AppText tone="secondary">That link doesn&apos;t match anything in the workout library.</AppText>
        <Button label="See all workouts" variant="outline" onPress={() => router.replace("/workouts")} />
      </Card>
    </Screen>
  );
}
