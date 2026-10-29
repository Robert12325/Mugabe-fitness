import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, Vibration } from "react-native";
import { RestTimer, formatClock } from "@/components/workouts/RestTimer";

/**
 * The rest countdown on an exercise: counts down the catalogue's own rest
 * time, buzzes when it can, and never leaves an interval running.
 */

let vibrate: jest.SpyInstance;
/** Intervals started and not yet cleared: the countdown's, since nothing else here uses intervals. */
let running: Set<unknown>;

beforeEach(() => {
  jest.useFakeTimers();
  vibrate = jest.spyOn(Vibration, "vibrate").mockImplementation(() => {});
  // React Native's test setup already mocks vibrate, and spyOn hands back
  // that same mock: clear the calls left by the previous test.
  vibrate.mockClear();

  running = new Set();
  const fakeSet = globalThis.setInterval;
  const fakeClear = globalThis.clearInterval;
  jest.spyOn(globalThis, "setInterval").mockImplementation(((handler: () => void, ms?: number) => {
    const id = fakeSet(handler, ms);
    running.add(id);
    return id;
  }) as typeof setInterval);
  jest.spyOn(globalThis, "clearInterval").mockImplementation(((id?: Parameters<typeof clearInterval>[0]) => {
    running.delete(id);
    fakeClear(id);
  }) as typeof clearInterval);
});

afterEach(async () => {
  // Close this test's screen while its fake clock still exists, so a
  // countdown left running can't tick into the next test.
  await cleanup();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

const remaining = () => screen.getByTestId("rest-remaining").props.children;

describe("formatClock", () => {
  it("writes minutes and seconds", () => {
    expect(formatClock(90)).toBe("1:30");
    expect(formatClock(45)).toBe("0:45");
    expect(formatClock(120)).toBe("2:00");
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(-3)).toBe("0:00");
  });
});

describe("rest countdown", () => {
  it("starts at the exercise's rest time and runs nothing until started", async () => {
    await render(<RestTimer seconds={90} />);

    expect(remaining()).toBe("1:30");
    expect(screen.getByText("Rest 1:30 between sets.")).toBeTruthy();
    expect(running.size).toBe(0);
  });

  it("counts down, then says rest is over and buzzes once", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    announce.mockClear();
    await render(<RestTimer seconds={3} />);

    await fireEvent.press(screen.getByTestId("rest-start"));
    await advance(1_100);
    expect(remaining()).toBe("0:02");

    await advance(2_000);
    expect(remaining()).toBe("0:00");
    expect(screen.getByText("Rest over")).toBeTruthy();
    expect(screen.getByText("Start your next set.")).toBeTruthy();
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(running.size).toBe(0);

    // Screen readers hear it once, at zero.
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Rest over. Start your next set.");

    // Time keeps passing: it buzzed once and stays finished.
    await advance(10_000);
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(remaining()).toBe("0:00");
  });

  it("restarts from the full time with only one countdown running", async () => {
    await render(<RestTimer seconds={60} />);

    await fireEvent.press(screen.getByTestId("rest-start"));
    await advance(20_000);
    expect(remaining()).toBe("0:40");

    await fireEvent.press(screen.getByRole("button", { name: "Restart rest timer" }));
    expect(remaining()).toBe("1:00");
    expect(running.size).toBe(1);

    await advance(1_100);
    expect(remaining()).toBe("0:59");
  });

  it("stops and resets, with no countdown left running", async () => {
    await render(<RestTimer seconds={60} />);

    await fireEvent.press(screen.getByTestId("rest-start"));
    await advance(5_000);
    await fireEvent.press(screen.getByTestId("rest-stop"));

    expect(remaining()).toBe("1:00");
    expect(running.size).toBe(0);
    await advance(120_000);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("clears its countdown when the screen closes", async () => {
    const view = await render(<RestTimer seconds={30} />);

    await fireEvent.press(screen.getByTestId("rest-start"));
    expect(running.size).toBe(1);

    await act(async () => view.unmount());
    expect(running.size).toBe(0);
    await advance(60_000);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("still finishes when the device can't vibrate", async () => {
    vibrate.mockImplementation(() => {
      throw new Error("no vibrator");
    });
    await render(<RestTimer seconds={1} />);

    await fireEvent.press(screen.getByTestId("rest-start"));
    await advance(1_500);

    expect(screen.getByText("Rest over")).toBeTruthy();
  });
});
