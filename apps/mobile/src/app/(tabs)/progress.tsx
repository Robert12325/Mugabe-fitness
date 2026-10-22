import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { SignedOutPrompt } from "@/components/SignedOutPrompt";
import { useAuth } from "@/auth/AuthProvider";

/** Placeholder for the daily log and weight tracking the website offers. */
export default function ProgressScreen() {
  const { state } = useAuth();

  return (
    <Screen testID="screen-progress">
      <PageHeader eyebrow="Track" title="Progress" />
      {state.status === "signedIn" ? (
        <ComingSoon
          icon="stats-chart"
          title="Your progress"
          description="Daily logs, weigh-ins and your coach's targets are coming to the app. Until then, you can track them on the website."
        />
      ) : (
        <SignedOutPrompt message="Sign in to track your progress." />
      )}
    </Screen>
  );
}
