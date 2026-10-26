import Ionicons from "@expo/vector-icons/Ionicons";
import { CATALOGUE, MODES, type WorkoutModeId } from "@mugabe/fitness-content";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MEMBERSHIP_STATUS } from "@/account/membership";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { StatStrip } from "@/components/progress/StatStrip";
import { SessionNotice } from "@/components/SessionNotice";
import { useDaily } from "@/daily/DailyProvider";
import { localToday } from "@/lib/daily";
import { CATEGORY_ICONS } from "@/components/workouts/look";
import { colors, radius, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/**
 * Home: a dashboard of the things the app really has. Every number shown is
 * real (exercise counts from the catalogue, the membership the server
 * reports); progress cards arrive with Daily Tracking.
 */
export default function HomeScreen() {
  const { state } = useAuth();

  return (
    <Screen testID="screen-home">
      <Header />

      <AppText variant="display" accessibilityRole="header">
        BECOME{"\n"}
        <AppText variant="display" tone="gold">
          STRONGER.
        </AppText>
      </AppText>

      <SessionNotice />

      <CoachingCard />

      <QuickTiles />

      <ProgressSection />

      <BodyPartRail />

      <MotivationCard />

      {state.status === "restoring" && (
        <ActivityIndicator color={colors.gold} accessibilityLabel="Checking your session" />
      )}
    </Screen>
  );
}

function greeting(now = new Date()) {
  const hour = now.getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** "Good morning, Robert" and the profile button. */
function Header() {
  const { state } = useAuth();
  const name = state.status === "signedIn" ? state.account.user.name.trim() : "";
  const first = name.split(" ")[0];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <AppText tone="secondary">
          {greeting()}
          {first ? (
            <>
              {", "}
              <AppText tone="gold" variant="bodyStrong">
                {first}
              </AppText>
            </>
          ) : null}
        </AppText>
        <AppText variant="small" tone="muted">
          {first ? "Ready to train today?" : "Welcome to Mugabe Fitness"}
        </AppText>
      </View>

      <Pressable
        onPress={() => router.navigate(first ? "/profile" : "/sign-in")}
        accessibilityRole="button"
        accessibilityLabel={first ? "Your profile" : "Sign in to your account"}
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
        testID="home-avatar"
      >
        {initials ? (
          <AppText variant="bodyStrong" tone="gold">
            {initials}
          </AppText>
        ) : (
          <Ionicons name="person" size={20} color={colors.gold} />
        )}
      </Pressable>
    </View>
  );
}

/** The coach's photo with the member's program, or a way in for visitors. */
function CoachingCard() {
  const { state } = useAuth();
  const signedIn = state.status === "signedIn";
  const signedOut = state.status === "signedOut";
  const membership = signedIn ? state.account.membership : null;
  const status = membership ? MEMBERSHIP_STATUS[membership.status] : null;

  return (
    <View style={styles.coaching} testID={signedIn ? "card-welcome" : signedOut ? "card-get-started" : undefined}>
      <View style={styles.coachingTop}>
        <Image
          source={require("../../../assets/coach.jpg")}
          style={styles.coachPhoto}
          resizeMode="cover"
          accessibilityLabel="Your coach at Mugabe Fitness"
        />
        {/* Fades the photo into the dark side where the text sits. */}
        <View style={[styles.fade, { left: "38%", opacity: 0.85 }]} />
        <View style={[styles.fade, { left: "48%", opacity: 0.55 }]} />
        <View style={[styles.fade, { left: "58%", opacity: 0.25 }]} />

        <View style={styles.coachingText}>
          <AppText variant="eyebrow" tone="gold">
            {signedIn ? "Your coaching" : "Personal coaching"}
          </AppText>
          <AppText variant="title" numberOfLines={3} style={styles.coachingTitle}>
            {signedIn ? membership?.programName || "Mugabe Fitness" : signedOut ? "Start your transformation" : "Train with purpose"}
          </AppText>
          {status ? (
            <View style={[styles.status, { borderColor: status.color }]}>
              <View style={[styles.dot, { backgroundColor: status.color }]} />
              <AppText variant="small" style={{ color: status.color }}>
                {status.label}
              </AppText>
            </View>
          ) : signedOut ? (
            <AppText variant="small" tone="secondary">
              Sign in with your website account, or create one.
            </AppText>
          ) : null}
        </View>

        {signedIn ? (
          <Pressable
            onPress={() => router.navigate("/program")}
            accessibilityRole="button"
            accessibilityLabel="View my program"
            style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.onGold} />
          </Pressable>
        ) : null}
      </View>

      {signedOut ? (
        <View style={styles.coachingActions}>
          <View style={styles.action}>
            <Button label="Sign in" onPress={() => router.push("/sign-in")} testID="home-sign-in" />
          </View>
          <View style={styles.action}>
            <Button label="Join" variant="outline" onPress={() => router.push("/register")} testID="home-register" />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const TILES: { label: string; hint: string; icon: IconName; href: Href }[] = [
  { label: "Gym", hint: "Gym workouts", icon: "barbell-outline", href: "/workouts/equipment" },
  { label: "No kit", hint: "No-equipment workouts", icon: "body-outline", href: "/workouts/no-equipment" },
  { label: "Program", hint: "Open my program", icon: "calendar-outline", href: "/program" },
  { label: "Progress", hint: "Open my progress", icon: "stats-chart-outline", href: "/progress" },
];

/** Four shortcuts, like the quick actions in a fitness app's home. */
function QuickTiles() {
  return (
    <View style={styles.tiles}>
      {TILES.map((tile) => (
        <Pressable
          key={tile.label}
          onPress={() => router.navigate(tile.href)}
          accessibilityRole="button"
          accessibilityLabel={tile.hint}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
        >
          <Ionicons name={tile.icon} size={24} color={colors.gold} />
          <AppText variant="small" numberOfLines={1} style={styles.tileLabel}>
            {tile.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

/** The member's own streak, workouts and weight, once their log has loaded. */
function ProgressSection() {
  const { state: auth } = useAuth();
  const { state } = useDaily();

  if (auth.status !== "signedIn" || state.status !== "ready") return null;

  return (
    <View style={styles.section} testID="home-progress">
      <View style={styles.sectionHead}>
        <AppText variant="heading" accessibilityRole="header">
          Your progress
        </AppText>
        <Pressable onPress={() => router.navigate("/progress")} accessibilityRole="button" accessibilityLabel="See all of my progress" hitSlop={8}>
          <AppText variant="small" tone="gold">
            View all
          </AppText>
        </Pressable>
      </View>
      <StatStrip log={state.data.log} weights={state.data.weights} today={localToday()} />
    </View>
  );
}

const MODE_TABS: { id: WorkoutModeId; label: string }[] = [
  { id: "equipment", label: "Gym" },
  { id: "no-equipment", label: "No equipment" },
];

/** Body parts of the chosen mode, with their real exercise counts. */
function BodyPartRail() {
  const [modeId, setModeId] = useState<WorkoutModeId>("equipment");
  const mode = MODES.find((candidate) => candidate.id === modeId) ?? MODES[0];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <AppText variant="heading" accessibilityRole="header">
          Train by body part
        </AppText>
        <Pressable onPress={() => router.navigate("/workouts")} accessibilityRole="button" accessibilityLabel="See all workouts" hitSlop={8}>
          <AppText variant="small" tone="gold">
            View all
          </AppText>
        </Pressable>
      </View>

      <View style={styles.segments}>
        {MODE_TABS.map((tab) => {
          const selected = tab.id === modeId;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setModeId(tab.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`home-mode-${tab.id}`}
              style={[styles.segment, selected && styles.segmentSelected]}
            >
              <AppText variant="small" style={{ color: selected ? colors.onGold : colors.textSecondary, fontWeight: "700" }}>
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.railScroll} contentContainerStyle={styles.rail}>
        {mode.categories.map((category) => {
          const count = CATALOGUE.published(mode.id, category.slug).length;
          const status = count ? `${count} ${count === 1 ? "exercise" : "exercises"}` : "Coming soon";

          return (
            <Pressable
              key={`${mode.id}-${category.slug}`}
              onPress={() =>
                router.navigate({ pathname: "/workouts/[mode]/[category]", params: { mode: mode.id, category: category.slug } })
              }
              accessibilityRole="button"
              accessibilityLabel={`${category.name}, ${status}`}
              testID={`home-category-${mode.id}-${category.slug}`}
              style={({ pressed }) => [styles.bodyPart, pressed && styles.tilePressed]}
            >
              <View style={styles.glow} />
              <Ionicons name={CATEGORY_ICONS[category.slug]} size={40} color={colors.gold} />
              <View style={styles.bodyPartText}>
                <AppText variant="bodyStrong" numberOfLines={2}>
                  {category.name}
                </AppText>
                <AppText variant="small" tone={count ? "secondary" : "muted"}>
                  {status}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function MotivationCard() {
  return (
    <View style={styles.motivation}>
      <Ionicons name="flash" size={26} color={colors.gold} />
      <View style={styles.motivationText}>
        <AppText variant="bodyStrong">Consistency beats intensity.</AppText>
        <AppText variant="small" tone="secondary">
          Show up today, even for 20 minutes.
        </AppText>
      </View>
      <Pressable
        onPress={() => router.navigate("/workouts")}
        accessibilityRole="button"
        accessibilityLabel="Start training"
        style={({ pressed }) => [styles.start, pressed && styles.pressed]}
      >
        <AppText variant="button" tone="onGold">
          Start
        </AppText>
        <Ionicons name="play" size={12} color={colors.onGold} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },

  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.goldTint,
    alignItems: "center",
    justifyContent: "center",
  },

  coaching: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#0d0b06",
    overflow: "hidden",
  },
  coachingTop: { height: 210, justifyContent: "center" },
  coachPhoto: { position: "absolute", top: 0, right: 0, width: "62%", height: "100%" },
  fade: { position: "absolute", top: 0, bottom: 0, width: "10%", backgroundColor: "#0d0b06" },
  coachingText: { width: "62%", paddingHorizontal: spacing.xl, gap: spacing.sm },
  // Fits "Start your transformation" in the narrow side of the card.
  coachingTitle: { fontSize: 22, lineHeight: 26 },
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
  arrow: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  coachingActions: { flexDirection: "row", gap: spacing.md, padding: spacing.lg, paddingTop: 0 },
  action: { flex: 1 },

  tiles: { flexDirection: "row", gap: spacing.sm },
  tile: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  tilePressed: { borderColor: colors.gold },
  tileLabel: { color: colors.text, fontWeight: "700" },

  section: { gap: spacing.md },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  segments: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radius.pill },
  segmentSelected: { backgroundColor: colors.gold },
  // Bleeds to the screen edges so cards scroll from edge to edge.
  railScroll: { marginHorizontal: -spacing.xl },
  rail: { gap: spacing.md, paddingHorizontal: spacing.xl },
  bodyPart: {
    width: 148,
    height: 172,
    padding: spacing.lg,
    justifyContent: "space-between",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    backgroundColor: "#100d05",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(212,175,55,0.14)",
  },
  bodyPartText: { gap: 2 },

  motivation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  motivationText: { flex: 1, gap: 2 },
  start: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.gold,
  },
});
