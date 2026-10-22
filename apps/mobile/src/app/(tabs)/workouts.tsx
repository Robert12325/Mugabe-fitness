import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";

/**
 * Placeholder. The workout library is a later phase; when it arrives,
 * access must be decided by a server-side entitlement for that content —
 * a coaching membership does not unlock it by itself.
 */
export default function WorkoutsScreen() {
  return (
    <Screen testID="screen-workouts">
      <PageHeader eyebrow="Train" title="Workouts" />
      <ComingSoon
        icon="barbell"
        title="Workout library"
        description="Guided workouts and exercise demonstrations are on the way."
      />
    </Screen>
  );
}
