import Ionicons from "@expo/vector-icons/Ionicons";
import { router, type Href } from "expo-router";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { MEMBERSHIP_STATUS } from "@/account/membership";
import type { CoachingMembership } from "@/api/account";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { ComingSoon } from "@/components/ComingSoon";
import { Glow } from "@/components/Glow";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { SignedOutPrompt } from "@/components/SignedOutPrompt";
import { websiteUrl } from "@/config/website";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function parse(iso: string) {
  const date = new Date(iso);
  return iso && !Number.isNaN(date.getTime()) ? date : null;
}

function formatMoment(iso: string) {
  const date = parse(iso);
  return date
    ? date.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";
}

function formatDay(iso: string) {
  const date = parse(iso);
  return date ? date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
}

/** Whole days until a moment, rounded up; null once it has passed. */
function daysUntil(iso: string, now = Date.now()) {
  const date = parse(iso);
  if (!date || date.getTime() <= now) return null;
  return Math.ceil((date.getTime() - now) / 86_400_000);
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

          <View style={styles.shortcuts}>
            <Shortcut icon="barbell" title="Train now" text="Pick a workout" href="/workouts" />
            <Shortcut icon="stats-chart" title="Track progress" text="Logs and weigh-ins" href="/progress" />
          </View>

          <AppText variant="heading" accessibilityRole="header">
            Coming next
          </AppText>
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
  const trialDays = membership.status === "trial" ? daysUntil(membership.trialEndsAt) : null;

  const facts: [label: string, value: string][] =
    membership.status === "trial"
      ? [
          ["Trial ends", formatMoment(membership.trialEndsAt)],
          ["Days left", trialDays === null ? "Ending now" : `${trialDays}`],
        ]
      : membership.status === "paid"
        ? [
            ["Paid until", formatDay(membership.paidThrough)],
            ["Next payment", formatDay(membership.nextDueAt)],
          ]
        : [];
  const shownFacts = facts.filter(([, value]) => value);

  const action =
    membership.status === "due" || membership.status === "expired"
      ? { text: "Renew from your account on the website.", label: "Renew on the website", url: websiteUrl("/account") }
      : membership.status === "none"
        ? { text: "Book a program on the website to start your free trial.", label: "Book on the website", url: websiteUrl("/") }
        : null;

  return (
    <View style={styles.card} testID="card-membership">
      <Glow size={200} />

      <AppText variant="eyebrow" tone="gold">
        Your program
      </AppText>
      <AppText variant="title">{membership.programName || "Mugabe Fitness"}</AppText>

      <View style={[styles.status, { borderColor: status.color }]}>
        <View style={[styles.dot, { backgroundColor: status.color }]} />
        <AppText variant="small" style={[styles.statusText, { color: status.color }]}>
          {status.label}
        </AppText>
      </View>

      {shownFacts.length > 0 && (
        <View style={styles.facts}>
          {shownFacts.map(([label, value]) => (
            <View key={label} style={styles.fact}>
              <AppText variant="eyebrow" tone="muted" style={styles.factLabel}>
                {label}
              </AppText>
              <AppText variant="bodyStrong">{value}</AppText>
            </View>
          ))}
        </View>
      )}

      {action ? (
        <>
          <AppText tone="secondary">{action.text}</AppText>
          {action.url ? <Button label={action.label} onPress={() => Linking.openURL(action.url as string)} /> : null}
        </>
      ) : null}
    </View>
  );
}

function Shortcut({ icon, title, text, href }: { icon: IconName; title: string; text: string; href: Href }) {
  return (
    <Pressable
      onPress={() => router.navigate(href)}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${text}`}
      style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}
    >
      <View style={styles.shortcutIcon}>
        <Ionicons name={icon} size={20} color={colors.gold} />
      </View>
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText variant="small" tone="secondary">
        {text}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#100d05",
    overflow: "hidden",
  },
  status: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontWeight: "700" },
  facts: { flexDirection: "row", gap: spacing.sm },
  fact: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  factLabel: { letterSpacing: 1.2 },
  shortcuts: { flexDirection: "row", gap: spacing.md },
  shortcut: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  pressed: { borderColor: colors.gold },
});
