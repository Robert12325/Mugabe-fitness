import { StyleSheet, View } from "react-native";
import { MEMBERSHIP_STATUS } from "@/account/membership";
import type { CoachingMembership } from "@/api/account";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { SignedOutPrompt } from "@/components/SignedOutPrompt";
import { radius, spacing } from "@/theme";

function formatMoment(iso: string) {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * The coaching membership, exactly as the server reported it. This is
 * information about the client's coaching — not a key to app content.
 */
export default function ProgramScreen() {
  const { state } = useAuth();

  return (
    <Screen testID="screen-program">
      <PageHeader eyebrow="Coaching" title="My Program" />

      {state.status === "signedIn" ? (
        <>
          <MembershipCard membership={state.account.membership} />
          <ComingSoon
            icon="calendar"
            title="Your schedule"
            description="Session times and your coach's plan for the week will appear here."
          />
        </>
      ) : (
        <SignedOutPrompt message="Sign in to see your coaching program." />
      )}
    </Screen>
  );
}

function MembershipCard({ membership }: { membership: CoachingMembership }) {
  const status = MEMBERSHIP_STATUS[membership.status];

  const detail =
    membership.status === "trial" && membership.trialEndsAt
      ? `Trial ends ${formatMoment(membership.trialEndsAt)}`
      : membership.status === "paid" && membership.paidThrough
        ? `Paid until ${formatMoment(membership.paidThrough)}`
        : membership.status === "due" || membership.status === "expired"
          ? "Renew from your account on the website."
          : membership.status === "none"
            ? "Book a program on the website to start your free trial."
            : "";

  return (
    <Card highlight testID="card-membership">
      <View style={styles.row}>
        <AppText variant="heading" style={styles.name}>
          {membership.programName || "Mugabe Fitness"}
        </AppText>
        <View style={[styles.badge, { borderColor: status.color }]}>
          <AppText variant="eyebrow" style={{ color: status.color, letterSpacing: 1.2 }}>
            {status.label}
          </AppText>
        </View>
      </View>
      {detail ? <AppText tone="secondary">{detail}</AppText> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, flexWrap: "wrap" },
  name: { flexShrink: 1 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
});
