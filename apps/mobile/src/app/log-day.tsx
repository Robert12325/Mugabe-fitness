import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { FormScreen } from "@/components/FormScreen";
import { formatDay } from "@/components/progress/DayRow";
import { LockedNotice } from "@/components/progress/LockedNotice";
import { SignedOutPrompt } from "@/components/SignedOutPrompt";
import { TextField } from "@/components/TextField";
import { useDaily } from "@/daily/DailyProvider";
import {
  FORM_BOXES,
  MAX_NOTES,
  addDays,
  checkDayForm,
  formFromDay,
  isEmptyPayload,
  isValidDate,
  localToday,
  type DayForm,
  type FormField,
} from "@/lib/daily";
import { colors, radius, spacing } from "@/theme";

/** Earliest day the server accepts. */
const EARLIEST = "2020-01-01";

function close() {
  if (router.canGoBack()) router.back();
  else router.replace("/progress");
}

/**
 * Log or edit one day. Opened from the Progress tab with `?on=YYYY-MM-DD`;
 * without one (or with a bad one) it opens on today.
 */
export default function LogDayScreen() {
  const params = useLocalSearchParams<{ on?: string }>();
  const today = localToday();
  const requested = typeof params.on === "string" && isValidDate(params.on, today) ? params.on : today;
  const [on, setOn] = useState(requested);

  const { state: auth } = useAuth();
  const { state } = useDaily();

  if (auth.status !== "signedIn") {
    return (
      <FormScreen testID="screen-log-day">
        <SignedOutPrompt message="Sign in to log your day." />
      </FormScreen>
    );
  }

  if (state.status === "locked") {
    return (
      <FormScreen testID="screen-log-day">
        <LockedNotice message={state.message} />
      </FormScreen>
    );
  }

  if (state.status !== "ready") {
    return (
      <FormScreen testID="screen-log-day">
        <Card>
          {state.status === "error" ? (
            <>
              <AppText variant="heading">Couldn&apos;t load your log</AppText>
              <AppText tone="secondary">{state.failure.message}</AppText>
              <Button label="Close" variant="outline" onPress={close} />
            </>
          ) : (
            <ActivityIndicator color={colors.gold} accessibilityLabel="Loading your daily log" />
          )}
        </Card>
      </FormScreen>
    );
  }

  const entry = state.data.log.find((day) => day.on === on) ?? null;
  const weighIn = state.data.weights.find((weight) => weight.on === on)?.grams ?? null;

  return (
    <FormScreen testID="screen-log-day">
      <DatePicker on={on} today={today} onChange={setOn} />
      {/* Keyed by date: switching day reopens the form on that day. */}
      <DayEditor key={on} on={on} today={today} exists={entry !== null || weighIn !== null} initial={formFromDay(entry, weighIn)} />
    </FormScreen>
  );
}

function DatePicker({ on, today, onChange }: { on: string; today: string; onChange: (on: string) => void }) {
  const canGoBack = on > EARLIEST;
  const canGoForward = on < today;

  return (
    <View style={styles.datePicker}>
      <Pressable
        onPress={() => canGoBack && onChange(addDays(on, -1))}
        disabled={!canGoBack}
        accessibilityRole="button"
        accessibilityLabel="Previous day"
        hitSlop={10}
        style={[styles.dateArrow, !canGoBack && styles.disabled]}
        testID="day-previous"
      >
        <Ionicons name="chevron-back" size={22} color={colors.gold} />
      </Pressable>

      <View style={styles.dateLabel}>
        <AppText variant="eyebrow" tone="gold">
          {on === today ? "Today" : on === addDays(today, -1) ? "Yesterday" : "Editing"}
        </AppText>
        <AppText variant="heading" testID="day-label">
          {formatDay(on)}
        </AppText>
      </View>

      <Pressable
        onPress={() => canGoForward && onChange(addDays(on, 1))}
        disabled={!canGoForward}
        accessibilityRole="button"
        accessibilityLabel="Next day"
        hitSlop={10}
        style={[styles.dateArrow, !canGoForward && styles.disabled]}
        testID="day-next"
      >
        <Ionicons name="chevron-forward" size={22} color={colors.gold} />
      </Pressable>
    </View>
  );
}

function DayEditor({
  on,
  today,
  exists,
  initial,
}: {
  on: string;
  today: string;
  exists: boolean;
  initial: DayForm;
}) {
  const { save, remove } = useDaily();
  const [form, setForm] = useState<DayForm>(initial);
  const [errors, setErrors] = useState<Partial<Record<FormField | "date", string>>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);

  const check = checkDayForm(form, on, today);
  const nothingEntered = check.ok && isEmptyPayload(check.payload);
  // A new day with nothing in it would just be thrown away by the server.
  const canSave = !(nothingEntered && !exists);

  function set<K extends keyof DayForm>(key: K, value: DayForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  }

  async function runDelete() {
    setBusy("delete");
    setFormError("");
    const result = await remove(on);
    setBusy(null);

    if (result.ok) close();
    else setFormError(result.failure.message);
  }

  function confirmDelete(message: string) {
    Alert.alert("Delete this day?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void runDelete() },
    ]);
  }

  async function submit() {
    if (busy) return;

    if (!check.ok) {
      setErrors(check.errors);
      setFormError(check.errors.date ?? "");
      return;
    }

    if (nothingEntered) {
      // Saving an emptied day removes it on the server; say so first.
      if (exists) confirmDelete("Everything for this day is empty, so saving removes it, weight included.");
      return;
    }

    setBusy("save");
    setFormError("");
    const result = await save(check.payload);
    setBusy(null);

    if (result.ok) close();
    else setFormError(result.failure.message);
  }

  return (
    <>
      <AppText variant="small" tone="muted">
        Fill in what you have — every field is optional.
      </AppText>

      <View style={styles.grid}>
        {FORM_BOXES.map((box) => (
          <View key={box.key} style={styles.cell}>
            <TextField
              label={box.unit ? `${box.label} (${box.unit})` : box.label}
              value={form[box.key]}
              onChangeText={(value) => set(box.key, value)}
              error={errors[box.key]}
              keyboardType={box.decimal ? "decimal-pad" : "number-pad"}
              autoComplete="off"
              maxLength={9}
              testID={`field-${box.key}`}
            />
          </View>
        ))}
      </View>

      <View style={styles.group}>
        <AppText variant="eyebrow" tone="secondary">
          Workout done?
        </AppText>
        <View style={styles.choices}>
          {[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ].map((option) => {
            const active = form.workout === option.value;

            return (
              <Pressable
                key={option.label}
                onPress={() => set("workout", active ? null : option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Workout done: ${option.label}`}
                style={[styles.choice, active && styles.choiceActive]}
                testID={`workout-${option.label.toLowerCase()}`}
              >
                <AppText variant="button" tone={active ? "onGold" : "secondary"}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <AppText variant="eyebrow" tone="secondary">
          Energy level (1–10)
        </AppText>
        <View style={styles.energy}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => {
            const active = form.energy === level;

            return (
              <Pressable
                key={level}
                onPress={() => set("energy", active ? null : level)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Energy ${level}`}
                style={[styles.energyChip, active && styles.choiceActive]}
                testID={`energy-${level}`}
              >
                <AppText variant="bodyStrong" tone={active ? "onGold" : "secondary"}>
                  {level}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TextField
        label="Meals & notes"
        value={form.notes}
        onChangeText={(value) => set("notes", value)}
        error={errors.notes}
        placeholder="What you ate today"
        multiline
        maxLength={MAX_NOTES}
        testID="field-notes"
      />

      {formError ? (
        <AppText tone="danger" accessibilityRole="alert" testID="log-day-error">
          {formError}
        </AppText>
      ) : null}

      <Button
        label="Save day"
        onPress={() => void submit()}
        loading={busy === "save"}
        disabled={!canSave || busy === "delete"}
        testID="save-day"
      />

      {exists && (
        <Button
          label="Delete this day"
          variant="ghost"
          onPress={() => confirmDelete("This removes everything logged for this day, weight included.")}
          loading={busy === "delete"}
          disabled={busy === "save"}
          testID="delete-day"
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  datePicker: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dateArrow: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.3 },
  dateLabel: { flex: 1, alignItems: "center", gap: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs },
  cell: { width: "50%", paddingHorizontal: spacing.xs, paddingBottom: spacing.md },
  group: { gap: spacing.sm },
  choices: { flexDirection: "row", gap: spacing.sm },
  choice: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  energy: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  energyChip: {
    width: "18%",
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
});
