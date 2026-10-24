import { MODES } from "@mugabe/fitness-content";
import { router } from "expo-router";
import { AppText } from "@/components/AppText";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { ModeCard } from "@/components/workouts/ModeCard";

/**
 * The two workout modes, from the catalogue the website also uses.
 *
 * Free and open without signing in. Premium content, if it comes, needs its
 * own server-side entitlement; a coaching membership does not unlock it.
 */
export default function WorkoutsScreen() {
  return (
    <Screen testID="screen-workouts">
      <PageHeader eyebrow="Train" title="Workouts" />

      <AppText tone="secondary">
        Two complete ways to train: in the gym with equipment, or anywhere with just your body.
      </AppText>

      {MODES.map((mode) => (
        <ModeCard
          key={mode.id}
          mode={mode}
          onPress={() => router.push({ pathname: "/workouts/[mode]", params: { mode: mode.id } })}
        />
      ))}
    </Screen>
  );
}
