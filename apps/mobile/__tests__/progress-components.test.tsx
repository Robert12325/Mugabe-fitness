import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking, StyleSheet } from "react-native";
import { LockedNotice } from "@/components/progress/LockedNotice";
import { Meter } from "@/components/progress/Meter";
import { TrendBars } from "@/components/progress/TrendBars";
import { formatKg, rangeDates, series } from "@/lib/daily";
import { colors } from "@/theme";

/**
 * The Progress building blocks on their own: trend data, the target meter
 * and its bar, the trend bars, and where "Renew on the website" goes.
 */

// What the app was built with. Read through a getter so each test can
// change it before rendering.
const mockConfig: { ok: boolean; baseUrl?: string; problem?: string } = {
  ok: true,
  baseUrl: "https://mugabe-fitness.example",
};

jest.mock("@/config/env", () => ({
  get apiConfig() {
    return mockConfig;
  },
}));

type Node = { type: string; props: Record<string, unknown>; children: (Node | string)[] | null };

/** Every rendered view whose flattened style matches. */
function viewsWhere(match: (style: Record<string, unknown>) => boolean) {
  const found: Record<string, unknown>[] = [];
  const walk = (node: Node | string | null) => {
    if (!node || typeof node === "string") return;
    const style = (StyleSheet.flatten(node.props.style as object) ?? {}) as Record<string, unknown>;
    if (match(style)) found.push(style);
    node.children?.forEach(walk);
  };
  const tree = screen.toJSON() as Node | Node[] | null;
  (Array.isArray(tree) ? tree : [tree]).forEach(walk);
  return found;
}

const goldBars = () =>
  viewsWhere((style) => style.backgroundColor === colors.gold && typeof style.height === "string");

describe("series() — trend data", () => {
  const points = [
    { on: "2026-10-19", value: 83600 },
    { on: "2026-10-01", value: 86000 }, // before the range
    { on: "2026-10-15", value: null }, // not logged
    { on: "2026-10-13", value: 84200 },
    { on: "2026-10-20", value: 80000 }, // after the range
  ];

  it("keeps only logged values inside the range, oldest first", () => {
    expect(series(points, "2026-10-13", "2026-10-19")).toEqual([
      { on: "2026-10-13", value: 84200 },
      { on: "2026-10-19", value: 83600 },
    ]);
  });

  it("includes both ends of the range, and is empty when nothing falls in it", () => {
    expect(series(points, "2026-10-19", "2026-10-19")).toEqual([{ on: "2026-10-19", value: 83600 }]);
    expect(series(points, "2026-09-01", "2026-09-30")).toEqual([]);
  });

  it("treats a logged 0 as a value, not a gap", () => {
    expect(series([{ on: "2026-10-19", value: 0 }], "2026-10-13", "2026-10-19")).toEqual([
      { on: "2026-10-19", value: 0 },
    ]);
  });
});

describe("Meter — percentage against the coach's target", () => {
  it("shows the rounded percentage and fills the bar to it", async () => {
    await render(<Meter label="Calories" value="1,850" target="2,000 kcal" percent={92.5} />);

    expect(screen.getByText("93%")).toBeTruthy();
    expect(viewsWhere((style) => style.backgroundColor === colors.gold && style.width === "92.5%")).toHaveLength(1);
  });

  it("caps the bar at 100% when the target is passed, but still shows the real figure", async () => {
    await render(<Meter label="Protein" value="154" target="140 g" percent={110} />);

    expect(screen.getByText("110%")).toBeTruthy();
    expect(viewsWhere((style) => style.backgroundColor === colors.gold && style.width === "100%")).toHaveLength(1);
  });

  it("shows an empty bar and no percentage when there's no target or nothing logged", async () => {
    await render(<Meter label="Steps" value="" target="" percent={null} />);

    expect(screen.queryByText(/%$/)).toBeNull();
    expect(screen.getByText("/ no target yet")).toBeTruthy();
    expect(screen.getByLabelText("Steps: not logged of no target yet")).toBeTruthy();
    expect(viewsWhere((style) => style.backgroundColor === colors.gold && style.width === "0%")).toHaveLength(1);
  });
});

describe("TrendBars — weight and waist trends", () => {
  const dates = rangeDates("week", "2026-10-19");
  const from = dates[0];
  const to = dates[dates.length - 1];

  it("draws one bar per logged day, lowest still visible, highest within the box", async () => {
    await render(
      <TrendBars
        title="Weight"
        points={[
          { on: "2026-10-13", value: 84200 },
          { on: "2026-10-16", value: 84000 },
          { on: "2026-10-19", value: 83600 },
        ]}
        from={from}
        to={to}
        format={formatKg}
        unit="kg"
        minSpan={2_000}
        empty="No weigh-ins in this period."
      />,
    );

    const heights = goldBars().map((style) => Number.parseFloat(String(style.height)));

    expect(heights).toHaveLength(3);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(12);
    expect(Math.max(...heights)).toBeLessThanOrEqual(100);
    // Oldest first, and the heaviest day is the tallest bar.
    expect(heights[0]).toBeGreaterThan(heights[2]);
    expect(screen.getByText("84.2 → 83.6 kg")).toBeTruthy();
  });

  it("marks the coach's target with a line and a caption", async () => {
    await render(
      <TrendBars
        title="Weight"
        points={[{ on: "2026-10-19", value: 83600 }]}
        from={from}
        to={to}
        format={formatKg}
        unit="kg"
        minSpan={2_000}
        target={78000}
        empty="No weigh-ins in this period."
      />,
    );

    expect(screen.getByText("Dashed line: your coach's target, 78 kg")).toBeTruthy();
    expect(viewsWhere((style) => style.borderStyle === "dashed")).toHaveLength(1);
  });

  it("says so when nothing was logged in the period", async () => {
    await render(
      <TrendBars
        title="Waist"
        points={[]}
        from={from}
        to={to}
        format={String}
        unit="cm"
        minSpan={20}
        empty="No waist measurements in this period."
      />,
    );

    expect(screen.getByText("No waist measurements in this period.")).toBeTruthy();
    expect(goldBars()).toHaveLength(0);
  });
});

describe("LockedNotice — renewal link", () => {
  afterEach(() => {
    mockConfig.ok = true;
    mockConfig.baseUrl = "https://mugabe-fitness.example";
    jest.restoreAllMocks();
  });

  it("opens the account page on the configured website, nowhere else", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await render(<LockedNotice message="Your access has expired. Renew your membership to continue." />);

    await fireEvent.press(screen.getByRole("button", { name: "Renew on the website" }));

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith("https://mugabe-fitness.example/account");
  });

  it("follows the configured address rather than a built-in one", async () => {
    mockConfig.baseUrl = "http://192.168.1.10:3000";
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await render(<LockedNotice message="Expired." />);

    await fireEvent.press(screen.getByRole("button", { name: "Renew on the website" }));

    expect(open).toHaveBeenCalledWith("http://192.168.1.10:3000/account");
  });

  it("shows the message but no link when the app has no backend configured", async () => {
    mockConfig.ok = false;
    delete mockConfig.baseUrl;
    await render(<LockedNotice message="Expired." />);

    expect(screen.getByText("Your access has ended")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Renew on the website" })).toBeNull();
  });
});
