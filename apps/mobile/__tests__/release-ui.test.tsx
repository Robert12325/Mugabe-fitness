import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Linking, Text } from "react-native";
import type { BuildInfo } from "@/release/build-info";
import { distributionFor } from "@/release/distribution";
import type { ReleaseManifest } from "@/release/manifest";
import { ReleaseProvider } from "@/release/ReleaseProvider";
import { UpdateNotices } from "@/release/UpdateNotices";
import { ReleaseGate } from "@/release/UpdateRequired";

/**
 * What a member sees: the blocking "Update required" screen, and the two
 * optional notices on Home. Every check is made with a stand-in manifest
 * loader and a stand-in expo-updates, so nothing touches the network.
 */

const mockUpdates = { isUpdatePending: false };
const mockReload = jest.fn(async () => undefined);

jest.mock("expo-updates", () => ({
  isEnabled: true,
  channel: null,
  useUpdates: () => ({ isUpdateAvailable: false, isUpdatePending: mockUpdates.isUpdatePending }),
  reloadAsync: () => mockReload(),
}));

jest.mock("@/config/env", () => ({
  apiConfig: { ok: true, baseUrl: "https://mugabe-fitness.example" },
}));

const build = (channel: string | null, versionCode: number | null = 3): BuildInfo => ({
  versionName: "0.1.0",
  versionCode,
  distribution: distributionFor(channel),
  updateId: null,
});

const manifest = (apk: Partial<ReleaseManifest["apk"]> = {}, play = 0, track: "production" | "staging" = "production"): ReleaseManifest => ({
  track,
  apk: { minimumVersionCode: 0, latestVersionCode: null, ...apk },
  play: { minimumVersionCode: play },
});

async function show(info: BuildInfo, load: jest.Mock) {
  await render(
    <ReleaseProvider info={info} load={load}>
      <ReleaseGate>
        <Text>The app</Text>
        <UpdateNotices />
      </ReleaseGate>
    </ReleaseProvider>,
  );
}

afterEach(() => {
  mockUpdates.isUpdatePending = false;
  mockReload.mockReset();
  mockReload.mockImplementation(async () => undefined);
  jest.restoreAllMocks();
});

describe("Update required", () => {
  it("replaces the app for an APK install below the minimum, and links to the download page", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const load = jest.fn(async () => manifest({ minimumVersionCode: 4 }));
    await show(build("production-apk", 3), load);

    expect(await screen.findByTestId("screen-update-required")).toBeTruthy();
    expect(screen.queryByText("The app")).toBeNull();
    expect(load).toHaveBeenCalledWith("production");

    await fireEvent.press(screen.getByRole("button", { name: "Get the new version" }));
    expect(open).toHaveBeenCalledWith("https://mugabe-fitness.example/download");
  });

  it("sends a Google Play install to Google Play", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await show(build("production-play", 3), jest.fn(async () => manifest({}, 9)));

    await fireEvent.press(await screen.findByRole("button", { name: "Update on Google Play" }));
    expect(open).toHaveBeenCalledWith("https://play.google.com/store/apps/details?id=com.mugabefitness.app");
  });

  it("gives the staging app no public link, and checks the staging manifest", async () => {
    const load = jest.fn(async () => manifest({ minimumVersionCode: 9 }, 0, "staging"));
    await show(build("staging", 3), load);

    expect(await screen.findByText(/install the newest staging build/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Get the new version" })).toBeNull();
    expect(load).toHaveBeenCalledWith("staging");
  });

  it("lets the member check again once the minimum is lowered", async () => {
    const load = jest
      .fn()
      .mockResolvedValueOnce(manifest({ minimumVersionCode: 4 }))
      .mockResolvedValueOnce(manifest({ minimumVersionCode: 0 }));
    await show(build("production-apk", 3), load);

    await fireEvent.press(await screen.findByRole("button", { name: "Check again" }));

    expect(await screen.findByText("The app")).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("never blocks when the check fails or the website can't be reached", async () => {
    await show(build("production-apk", 3), jest.fn(async () => null));
    await waitFor(() => expect(screen.getByText("The app")).toBeTruthy());

    await show(build("production-apk", 3), jest.fn(async () => Promise.reject(new Error("offline"))));
    await waitFor(() => expect(screen.getByText("The app")).toBeTruthy());
    expect(screen.queryByTestId("screen-update-required")).toBeNull();
  });

  it("doesn't check at all in development builds, Expo Go or on the web", async () => {
    const load = jest.fn(async () => manifest({ minimumVersionCode: 99 }));
    await show(build(null), load);
    await show(build("production-apk", null), load);

    expect(screen.getByText("The app")).toBeTruthy();
    expect(load).not.toHaveBeenCalled();
  });
});

describe("New version available", () => {
  it("offers a newer APK, opens the download page, and can be put off", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    await show(build("production-apk", 3), jest.fn(async () => manifest({ latestVersionCode: 4 })));

    expect(await screen.findByTestId("notice-new-version")).toBeTruthy();
    expect(screen.getByText("The app")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Get it" }));
    expect(open).toHaveBeenCalledWith("https://mugabe-fitness.example/download");

    await fireEvent.press(screen.getByRole("button", { name: "Later" }));
    expect(screen.queryByTestId("notice-new-version")).toBeNull();
  });

  it("stays quiet when the installed build is the latest", async () => {
    const load = jest.fn(async () => manifest({ latestVersionCode: 3 }));
    await show(build("production-apk", 3), load);

    await waitFor(() => expect(load).toHaveBeenCalled());
    expect(screen.queryByTestId("notice-new-version")).toBeNull();
  });
});

describe("Update ready", () => {
  it("offers a restart once an update has downloaded, and restarts only when tapped", async () => {
    mockUpdates.isUpdatePending = true;
    await show(build("production-apk"), jest.fn(async () => null));

    expect(await screen.findByTestId("notice-update-ready")).toBeTruthy();
    expect(mockReload).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: "Restart now" }));
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it("explains what to do if the restart fails", async () => {
    mockUpdates.isUpdatePending = true;
    mockReload.mockImplementation(async () => Promise.reject(new Error("reload failed")));
    await show(build("production-apk"), jest.fn(async () => null));

    await fireEvent.press(await screen.findByRole("button", { name: "Restart now" }));
    expect(await screen.findByText(/Close it and open it again/)).toBeTruthy();
  });

  it("can be put off until next launch", async () => {
    mockUpdates.isUpdatePending = true;
    await show(build("production-apk"), jest.fn(async () => null));

    await fireEvent.press(await screen.findByRole("button", { name: "Later" }));
    expect(screen.queryByTestId("notice-update-ready")).toBeNull();
  });

  it("isn't shown in development builds", async () => {
    mockUpdates.isUpdatePending = true;
    await show(build(null), jest.fn(async () => null));

    expect(screen.getByText("The app")).toBeTruthy();
    expect(screen.queryByTestId("notice-update-ready")).toBeNull();
  });
});
