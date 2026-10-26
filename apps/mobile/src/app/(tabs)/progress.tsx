import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { DayRow, formatDay } from "@/components/progress/DayRow";
import { LockedNotice } from "@/components/progress/LockedNotice";
import { Meter } from "@/components/progress/Meter";
import { SummaryCard } from "@/components/progress/SummaryCard";
import { TrendBars } from "@/components/progress/TrendBars";
import { WorkoutRow } from "@/components/progress/WorkoutRow";
import { Screen } from "@/components/Screen";
import { SignedOutPrompt } from "@/components/SignedOutPrompt";
import { useDaily } from "@/daily/DailyProvider";
import type { DailyLoad } from "@/api/daily";
import {
  RANGE_DAYS,
  formatCount,
  formatKg,
  fromUnits,
  localToday,
  rangeDates,
  series,
  summarize,
  workoutDays,
  type Range,
} from "@/lib/daily";
import { colors, radius, spacing } from "@/theme";

function openDay(on: string) {
  router.push({ pathname: "/log-day", params: { on } });
}

export default function ProgressScreen() {
  const { state: auth } = useAuth();
  const { state, refresh } = useDaily();

  const refreshing = state.status === "ready" && state.refreshing;

  return (
    <Screen
      testID="screen-progress"
      refreshControl={
        state.status === "ready" ? (
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.gold} />
        ) : undefined
      }
    >
      <PageHeader eyebrow="Track" title="Progress" />

      {auth.status !== "signedIn" ? (
        <SignedOutPrompt message="Sign in to log your day and see your progress." />
      ) : state.status === "loading" || state.status === "idle" ? (
        <Card testID="daily-loading">
          <ActivityIndicator color={colors.gold} accessibilityLabel="Loading your daily log" />
          <AppText tone="secondary" style={styles.center}>
            Loading your daily log…
          </AppText>
        </Card>
      ) : state.status === "locked" ? (
        <LockedNotice message={state.message} />
      ) : state.status === "error" ? (
        <Card testID="daily-error">
          <AppText variant="heading">Couldn&apos;t load your log</AppText>
          <AppText tone="secondary">{state.failure.message}</AppText>
          <Button label="Try again" variant="outline" onPress={() => void refresh()} testID="daily-retry" />
        </Card>
      ) : (
        <Ready data={state.data} refreshFailure={state.refreshFailure?.message ?? null} onRetry={() => void refresh()} />
      )}
    </Screen>
  );
}

function percentOf(value: number | null | undefined, target: number | null) {
  return value == null || !target ? null : (value / target) * 100;
}

function Ready({
  data,
  refreshFailure,
  onRetry,
}: {
  data: DailyLoad;
  refreshFailure: string | null;
  onRetry: () => void;
}) {
  const today = localToday();
  const [range, setRange] = useState<Range>("week");

  const dates = useMemo(() => rangeDates(range, today), [range, today]);
  const from = dates[0];
  const to = dates[dates.length - 1];

  const { log, weights, targets } = data;
  const todayEntry = log.find((entry) => entry.on === today) ?? null;
  const todayWeight = weights.find((entry) => entry.on === today)?.grams ?? null;
  const summary = summarize(log, weights, from, to);

  // Every day with something logged — a weigh-in alone counts.
  const historyDays = [...new Set([...log.map((entry) => entry.on), ...weights.map((entry) => entry.on)])]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 14);

  const amount = (value: number | null, unit: string, scale = 1) =>
    value === null ? "" : `${scale === 1 ? formatCount(value) : fromUnits(value, scale)} ${unit}`.trim();

  return (
    <>
      {refreshFailure && (
        <View style={styles.banner} accessibilityRole="alert" testID="daily-refresh-failed">
          <AppText variant="small" tone="secondary" style={styles.bannerText}>
            Couldn&apos;t refresh — showing your last saved log. {refreshFailure}
          </AppText>
          <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
            <AppText variant="button" tone="gold">
              Retry
            </AppText>
          </Pressable>
        </View>
      )}

      <Card highlight testID="today-card">
        <View style={styles.rowBetween}>
          <AppText variant="eyebrow" tone="gold">
            Today
          </AppText>
          <AppText variant="small" tone="muted">
            {formatDay(today)}
          </AppText>
        </View>

        <View style={styles.meters}>
          <Meter
            label="Calories"
            value={todayEntry?.caloriesKcal != null ? formatCount(todayEntry.caloriesKcal) : ""}
            target={amount(targets.caloriesKcal, "kcal")}
            percent={percentOf(todayEntry?.caloriesKcal, targets.caloriesKcal)}
            testID="meter-calories"
          />
          <Meter
            label="Protein"
            value={todayEntry?.proteinG != null ? `${todayEntry.proteinG}` : ""}
            target={amount(targets.proteinG, "g")}
            percent={percentOf(todayEntry?.proteinG, targets.proteinG)}
          />
          <Meter
            label="Water"
            value={todayEntry?.waterMl != null ? `${fromUnits(todayEntry.waterMl, 1000)} L` : ""}
            target={amount(targets.waterMl, "L", 1000)}
            percent={percentOf(todayEntry?.waterMl, targets.waterMl)}
          />
          <Meter
            label="Steps"
            value={todayEntry?.steps != null ? formatCount(todayEntry.steps) : ""}
            target={amount(targets.steps, "")}
            percent={percentOf(todayEntry?.steps, targets.steps)}
          />
        </View>

        <View style={styles.tiles}>
          <Tile
            label="Workout"
            value={todayEntry?.workout === true ? "Done" : todayEntry?.workout === false ? "Skipped" : ""}
            gold={todayEntry?.workout === true}
          />
          <Tile label="Sleep" value={todayEntry?.sleepMin != null ? `${fromUnits(todayEntry.sleepMin, 60)} h` : ""} />
          <Tile label="Energy" value={todayEntry?.energy != null ? `${todayEntry.energy}/10` : ""} />
          <Tile label="Weight" value={todayWeight !== null ? `${formatKg(todayWeight)} kg` : ""} />
        </View>

        <Button
          label={todayEntry || todayWeight !== null ? "Edit today" : "Log today"}
          onPress={() => openDay(today)}
          testID="log-today"
        />
      </Card>

      <View style={styles.toggle} accessibilityRole="tablist">
        {(["week", "month"] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setRange(option)}
            accessibilityRole="tab"
            accessibilityState={{ selected: range === option }}
            style={[styles.toggleButton, range === option && styles.toggleActive]}
            testID={`range-${option}`}
          >
            <AppText variant="button" tone={range === option ? "onGold" : "secondary"}>
              {option === "week" ? "Last 7 days" : "Last 30 days"}
            </AppText>
          </Pressable>
        ))}
      </View>

      <SummaryCard
        title={range === "week" ? "Weekly progress" : "Monthly progress"}
        summary={summary}
        days={RANGE_DAYS[range]}
      />

      <TrendBars
        title="Weight"
        points={series(weights.map((entry) => ({ on: entry.on, value: entry.grams })), from, to)}
        from={from}
        to={to}
        format={formatKg}
        unit="kg"
        minSpan={2_000}
        target={targets.weightGrams}
        empty="No weigh-ins in this period."
        testID="trend-weight"
      />

      <TrendBars
        title="Waist"
        points={series(log.map((entry) => ({ on: entry.on, value: entry.waistMm })), from, to)}
        from={from}
        to={to}
        format={(mm) => fromUnits(mm, 10)}
        unit="cm"
        minSpan={20}
        target={targets.waistMm}
        empty="No waist measurements in this period."
        testID="trend-waist"
      />

      <WorkoutRow days={workoutDays(log, dates)} done={summary.workoutsDone} answered={summary.workoutsAnswered} />

      <Card testID="history">
        <AppText variant="heading">Recent days</AppText>
        {historyDays.length === 0 ? (
          <View style={styles.empty} testID="history-empty">
            <AppText tone="secondary">
              No days logged yet. Log today — every field is optional.
            </AppText>
          </View>
        ) : (
          historyDays.map((on) => (
            <DayRow
              key={on}
              on={on}
              entry={log.find((entry) => entry.on === on) ?? null}
              weightGrams={weights.find((entry) => entry.on === on)?.grams ?? null}
              onPress={() => openDay(on)}
            />
          ))
        )}
      </Card>
    </>
  );
}

function Tile({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value || "not logged"}`}>
      <AppText variant="eyebrow" tone="muted" style={styles.tileLabel}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" tone={gold ? "gold" : value ? "default" : "muted"}>
        {value || "Not logged"}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  tileLabel: { letterSpacing: 1.4 },
  toggle: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, minHeight: 40, justifyContent: "center" },
  toggleActive: { backgroundColor: colors.gold },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(243,207,115,0.35)",
    backgroundColor: "rgba(243,207,115,0.07)",
  },
  bannerText: { flex: 1 },
  empty: { paddingVertical: spacing.md },
});
