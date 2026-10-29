import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Vibration, View } from "react-native";
import { AppText } from "@/components/AppText";
import { colors, radius, spacing } from "@/theme";

/** 90 -> "1:30"; 45 -> "0:45". */
export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** A short buzz where the device can; silently nothing where it can't. */
function buzz() {
  try {
    if (Platform.OS === "web" && !(typeof navigator !== "undefined" && "vibrate" in navigator)) return;
    Vibration.vibrate(Platform.OS === "android" ? [0, 400, 200, 400] : 400);
  } catch {
    // Vibration is optional: no motor, or not allowed.
  }
}

/**
 * Counts down the exercise's own rest time between sets. It runs from a
 * fixed end time, so it stays right if the phone sleeps, and stops cleanly
 * when the screen closes or the countdown restarts.
 */
export function RestTimer({ seconds }: { seconds: number }) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(seconds);
  const [done, setDone] = useState(false);

  // Give it key={exercise.slug} where it's used: another exercise gets a
  // fresh timer, and the old one's interval is cleared with it.
  useEffect(() => {
    if (endsAt === null) return;

    // Set once this countdown has finished or been replaced, so a tick that
    // fires before React re-renders can't buzz a second time.
    let over = false;

    const tick = () => {
      if (over) return;

      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);

      if (left === 0) {
        over = true;
        clearInterval(id);
        setEndsAt(null);
        setDone(true);
        buzz();
        AccessibilityInfo.announceForAccessibility?.("Rest over. Start your next set.");
      }
    };

    // start() has already shown the full time; the first tick follows.
    const id = setInterval(tick, 250);
    return () => {
      over = true;
      clearInterval(id);
    };
  }, [endsAt]);

  const running = endsAt !== null;

  function start() {
    setDone(false);
    setRemaining(seconds);
    setEndsAt(Date.now() + seconds * 1000);
  }

  function stop() {
    setEndsAt(null);
    setDone(false);
    setRemaining(seconds);
  }

  const progress = seconds > 0 ? remaining / seconds : 0;

  return (
    <View style={[styles.card, done && styles.cardDone]} testID="rest-timer">
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name={done ? "checkmark" : "hourglass-outline"} size={20} color={done ? colors.onGold : colors.gold} />
        </View>
        <View style={styles.text}>
          <AppText variant="eyebrow" tone="gold">
            {done ? "Rest over" : "Rest timer"}
          </AppText>
          <AppText
            variant="title"
            style={styles.clock}
            accessibilityLiveRegion={running ? "polite" : "none"}
            testID="rest-remaining"
          >
            {formatClock(remaining)}
          </AppText>
          <AppText variant="small" tone="secondary">
            {done ? "Start your next set." : `Rest ${formatClock(seconds)} between sets.`}
          </AppText>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={start}
          accessibilityRole="button"
          accessibilityLabel={running || done ? "Restart rest timer" : "Start rest timer"}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
          testID="rest-start"
        >
          <Ionicons name={running || done ? "refresh" : "play"} size={16} color={colors.onGold} />
          <AppText variant="button" tone="onGold">
            {running || done ? "Restart" : "Start rest"}
          </AppText>
        </Pressable>
        {running ? (
          <Pressable
            onPress={stop}
            accessibilityRole="button"
            accessibilityLabel="Stop rest timer"
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            testID="rest-stop"
          >
            <Ionicons name="stop" size={14} color={colors.gold} />
            <AppText variant="button" tone="gold">
              Stop
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    backgroundColor: colors.surfaceRaised,
  },
  cardDone: { borderColor: colors.gold, backgroundColor: "#100d05" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
  },
  text: { flex: 1, gap: 2 },
  clock: { fontSize: 32, lineHeight: 36 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.gold },
  actions: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  primary: {
    flexGrow: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.lg,
  },
  secondary: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: spacing.lg,
  },
  pressed: { opacity: 0.85 },
});
