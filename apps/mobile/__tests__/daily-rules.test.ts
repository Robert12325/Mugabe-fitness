import {
  EMPTY_FORM,
  addDays,
  checkDayForm,
  daysBetween,
  formFromDay,
  formatDeltaKg,
  formatKg,
  fromUnits,
  isEmptyPayload,
  isValidDate,
  localToday,
  normalizeDailyLog,
  normalizeTargets,
  normalizeWeights,
  parseKg,
  rangeDates,
  summarize,
  toUnits,
  workoutDays,
  type DailyEntry,
  type DayForm,
} from "@/lib/daily";

/**
 * Pins the app's copy of the daily rules to the website's. The summary,
 * unit and date cases are the ones the website's `src/lib/daily.ts` was
 * tested with; the form cases mirror the server's `parseDay`.
 */

const TODAY = "2026-10-19";

const day = (on: string, extra: Partial<DailyEntry> = {}): DailyEntry => ({
  on,
  caloriesKcal: null,
  proteinG: null,
  waterMl: null,
  steps: null,
  waistMm: null,
  sleepMin: null,
  workout: null,
  energy: null,
  notes: "",
  ...extra,
});

const form = (extra: Partial<DayForm>): DayForm => ({ ...EMPTY_FORM, ...extra });

describe("units (same as the website form)", () => {
  it("converts typed values into stored units and back", () => {
    expect(toUnits("2.5", 1000)).toBe(2500);
    expect(toUnits("2,5", 1000)).toBe(2500); // decimal comma
    expect(toUnits("", 1000)).toBeNull();
    expect(toUnits("abc", 1)).toBeNaN();
    expect(toUnits("-3", 1)).toBeNaN();
    expect(toUnits("7.5", 60)).toBe(450);
    expect(fromUnits(2500, 1000)).toBe("2.5");
    expect(fromUnits(3000, 1000)).toBe("3");
    expect(fromUnits(905, 10)).toBe("90.5");
  });

  it("reads and formats kilograms like the website", () => {
    expect(parseKg("72.4")).toBe(72400);
    expect(parseKg("72,4")).toBe(72400);
    expect(parseKg(" 72.4 kg ")).toBe(72400);
    expect(parseKg("-5")).toBe(0);
    expect(formatKg(72000)).toBe("72");
    expect(formatKg(84200)).toBe("84.2");
    expect(formatDeltaKg(-600)).toBe("-0.6");
    expect(formatDeltaKg(40)).toBe("0");
  });

  it.each([
    ["72.4", 72400],
    ["72,4", 72400],
    [" 72.4 kg ", 72400],
    ["72kg", 72000],
    ["72 KG", 72000],
    ["72", 72000],
    ["72.45", 72450],
    ["72.456", 72456],
  ])("reads %p as %i grams", (input, grams) => {
    expect(parseKg(input)).toBe(grams);
  });

  it.each(["", "kg", "-72", "+72", "72.", ".5", "7 2", "72.4.1", "72,,4", "72.4567", "8a4.2", "abc", "72 kgs", "72 lb", "1e2", "72.4 kg extra"])(
    "refuses %p as a weight rather than guessing",
    (input) => {
      expect(parseKg(input)).toBe(0);
    },
  );
});

describe("days", () => {
  it("shifts and counts calendar days without timezones", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-10-13", "2026-10-19")).toBe(6);
  });

  it("builds the 7 and 30 day ranges ending today", () => {
    const week = rangeDates("week", TODAY);
    expect(week).toHaveLength(7);
    expect(week[0]).toBe("2026-10-13");
    expect(week[6]).toBe(TODAY);
    expect(rangeDates("month", TODAY)).toHaveLength(30);
  });

  it("accepts dates from 2020-01-01 to today only", () => {
    expect(isValidDate(TODAY, TODAY)).toBe(true);
    expect(isValidDate("2026-10-20", TODAY)).toBe(false);
    expect(isValidDate("2019-12-31", TODAY)).toBe(false);
    expect(isValidDate("19/10/2026", TODAY)).toBe(false);
  });

  it("accepts only real calendar days", () => {
    for (const on of ["2026-02-31", "2026-02-29", "2026-04-31", "2026-13-01", "2026-00-10", "2026-10-00"]) {
      expect(isValidDate(on, TODAY)).toBe(false);
    }
    for (const on of ["2024-02-29", "2020-01-01", TODAY]) {
      expect(isValidDate(on, TODAY)).toBe(true);
    }
  });

  it("drops stored entries with impossible dates", () => {
    expect(normalizeDailyLog([{ on: "2026-02-31", steps: 100 }, { on: "2026-02-28", steps: 200 }]).map((e) => e.on)).toEqual(["2026-02-28"]);
    expect(
      normalizeWeights({ entries: [{ on: "2026-02-31", grams: 80000 }, { on: "2026-02-28", grams: 81000 }] }).map((e) => e.on),
    ).toEqual(["2026-02-28"]);
  });

  it("uses the phone's own calendar date", () => {
    expect(localToday(new Date(2026, 9, 19, 23, 30))).toBe("2026-10-19");
  });
});

describe("summary (the website's example week)", () => {
  const log = normalizeDailyLog([
    day("2026-10-19", { caloriesKcal: 1800, proteinG: 120, steps: 8000, workout: true, waistMm: 895 }),
    day("2026-10-17", { caloriesKcal: 1900, proteinG: 130, steps: 8400, workout: true }),
    day("2026-10-14", { caloriesKcal: 1850, proteinG: 125, steps: 8200, workout: true, waistMm: 910 }),
    day("2026-10-01", { caloriesKcal: 3000, workout: false }),
  ]);
  const weights = [
    { on: "2026-10-19", grams: 83600, note: "" },
    { on: "2026-10-13", grams: 84200, note: "" },
    { on: "2026-10-01", grams: 86000, note: "" },
  ];

  it("averages only the days that logged each value", () => {
    const summary = summarize(log, weights, "2026-10-13", TODAY);

    expect(summary.daysLogged).toBe(3);
    expect(summary.caloriesKcal).toBe(1850);
    expect(summary.proteinG).toBe(125);
    expect(Math.round(summary.steps ?? 0)).toBe(8200);
    expect(summary.waterMl).toBeNull(); // nothing logged -> null, not 0
    expect(summary.workoutsDone).toBe(3);
    expect(summary.workoutsAnswered).toBe(3);
    expect(summary.weight).toEqual({ from: 84200, to: 83600 });
    expect(summary.waist).toEqual({ from: 910, to: 895 });
  });

  it("marks each day trained, skipped or not logged", () => {
    const cells = workoutDays(log, rangeDates("week", TODAY));

    expect(cells).toHaveLength(7);
    expect(cells[6].workout).toBe(true);
    expect(cells[5].workout).toBeNull();
  });
});

describe("reading server responses", () => {
  it("keeps one entry per day, newest first, dropping out-of-range values", () => {
    const log = normalizeDailyLog([
      { on: "2026-10-18", caloriesKcal: 99999, steps: 500 },
      { on: "2026-10-19", workout: true },
      { on: "2026-10-19", workout: false },
      { on: "nope", steps: 1 },
      { on: "2026-10-10" },
    ]);

    expect(log).toHaveLength(2);
    expect(log[0]).toMatchObject({ on: "2026-10-19", workout: true });
    expect(log[1]).toMatchObject({ caloriesKcal: null, steps: 500 });
  });

  it("never invents a target", () => {
    expect(normalizeTargets({}).caloriesKcal).toBeNull();
    expect(normalizeTargets({ caloriesKcal: 0 }).caloriesKcal).toBeNull();
    expect(normalizeTargets({ weightGrams: 78000 }).weightGrams).toBe(78000);
  });

  it("reads weigh-ins from the progress document", () => {
    expect(
      normalizeWeights({
        goal: { targetGrams: 0, targetOn: "" },
        entries: [
          { on: "2026-10-19", grams: 84200, note: "after gym" },
          { on: "2026-10-18", grams: 5 },
        ],
      }),
    ).toEqual([{ on: "2026-10-19", grams: 84200, note: "after gym" }]);
  });
});

describe("checking the form (mirrors the server's parseDay)", () => {
  it("builds the exact payload the API takes, in stored units", () => {
    const result = checkDayForm(
      form({
        caloriesKcal: "1,850",
        proteinG: "125",
        water: "2,5",
        steps: "8 200",
        weight: "84.2",
        waist: "90.5",
        sleep: "7.5",
        workout: true,
        energy: 7,
        notes: "  oats, dal  ",
      }),
      TODAY,
      TODAY,
    );

    expect(result).toEqual({
      ok: true,
      payload: {
        on: TODAY,
        caloriesKcal: 1850,
        proteinG: 125,
        waterMl: 2500,
        steps: 8200,
        waistMm: 905,
        sleepMin: 450,
        workout: true,
        energy: 7,
        notes: "oats, dal",
        weightGrams: 84200,
      },
    });
  });

  it("sends weightGrams null when the weight box is empty", () => {
    const result = checkDayForm(form({ caloriesKcal: "100" }), TODAY, TODAY);
    expect(result.ok && result.payload.weightGrams).toBeNull();
  });

  it.each([
    ["caloriesKcal", "10001", "out of range"],
    ["proteinG", "1001", "out of range"],
    ["water", "20.1", "out of range"],
    ["steps", "200001", "out of range"],
    ["waist", "29", "out of range"],
    ["waist", "251", "out of range"],
    ["sleep", "24.1", "out of range"],
    ["caloriesKcal", "abc", "enter a number"],
    ["water", "-1", "enter a number"],
  ] as const)("refuses %s = %s", (key, text, message) => {
    const result = checkDayForm(form({ [key]: text }), TODAY, TODAY);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors[key]).toMatch(message);
  });

  it("refuses weights outside 20-400 kg", () => {
    for (const weight of ["19.9", "400.1"]) {
      const result = checkDayForm(form({ weight }), TODAY, TODAY);
      expect(!result.ok && result.errors.weight).toMatch(/20 and 400 kg/);
    }
  });

  it("asks for a number when the weight isn't one, instead of guessing", () => {
    for (const weight of ["abc", "84.2.3", "8a4.2"]) {
      const result = checkDayForm(form({ weight }), TODAY, TODAY);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.errors.weight).toBe("Weight: enter a number, like 72.4.");
    }
  });

  it("refuses an impossible date", () => {
    const result = checkDayForm(form({ steps: "1" }), "2026-02-31", TODAY);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.date).toMatch(/today or earlier/);
  });

  it("refuses notes over 500 characters and future dates", () => {
    expect(checkDayForm(form({ notes: "x".repeat(501) }), TODAY, TODAY).ok).toBe(false);
    const future = checkDayForm(form({ steps: "1" }), "2026-10-20", TODAY);
    expect(!future.ok && future.errors.date).toMatch(/today or earlier/);
  });

  it("keeps a real 0 as 0 rather than 'not logged'", () => {
    const result = checkDayForm(form({ steps: "0" }), TODAY, TODAY);
    expect(result.ok && result.payload.steps).toBe(0);
  });

  it("recognises a form with nothing in it", () => {
    const empty = checkDayForm(EMPTY_FORM, TODAY, TODAY);
    expect(empty.ok && isEmptyPayload(empty.payload)).toBe(true);

    const weightOnly = checkDayForm(form({ weight: "80" }), TODAY, TODAY);
    expect(weightOnly.ok && isEmptyPayload(weightOnly.payload)).toBe(false);
  });

  it("opens an existing day with what was logged, weight included", () => {
    const opened = formFromDay(
      day(TODAY, { caloriesKcal: 1850, waterMl: 2500, waistMm: 905, sleepMin: 450, workout: false, energy: 6, notes: "rest" }),
      84200,
    );

    expect(opened).toEqual({
      caloriesKcal: "1850",
      proteinG: "",
      water: "2.5",
      steps: "",
      weight: "84.2",
      waist: "90.5",
      sleep: "7.5",
      workout: false,
      energy: 6,
      notes: "rest",
    });
  });
});
