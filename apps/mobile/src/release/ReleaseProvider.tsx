import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { readBuildInfo, type BuildInfo } from "./build-info";
import { binaryStatus, loadReleaseManifest, type BinaryStatus, type ReleaseManifest } from "./manifest";
import type { Track } from "./distribution";

/**
 * Checks once per launch whether this build is still current, from the
 * website's release manifest. Release builds only (see distribution.ts);
 * everywhere else the status stays "unknown" and nothing is fetched.
 *
 * A failed check is simply "unknown": the app carries on and asks again
 * next launch.
 */

type ReleaseState = {
  info: BuildInfo;
  status: BinaryStatus;
  /** Asks the website again, e.g. from the "Update required" screen. */
  recheck: () => void;
};

const ReleaseContext = createContext<ReleaseState | null>(null);

export function ReleaseProvider({
  children,
  info: givenInfo,
  load = loadReleaseManifest,
}: {
  children: ReactNode;
  /** For tests; read from the device otherwise. */
  info?: BuildInfo;
  load?: (track: Track) => Promise<ReleaseManifest | null>;
}) {
  const [info] = useState(() => givenInfo ?? readBuildInfo());
  const [status, setStatus] = useState<BinaryStatus>({ kind: "unknown" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const { distribution, versionCode } = info;
    if (!distribution || versionCode === null) return;

    let current = true;

    void load(distribution.track)
      .catch(() => null)
      .then((manifest) => {
        if (current) setStatus(binaryStatus(manifest, distribution, versionCode));
      });

    return () => {
      current = false;
    };
  }, [info, load, attempt]);

  const recheck = useCallback(() => setAttempt((n) => n + 1), []);

  return <ReleaseContext.Provider value={{ info, status, recheck }}>{children}</ReleaseContext.Provider>;
}

export function useRelease(): ReleaseState {
  const value = useContext(ReleaseContext);
  if (!value) throw new Error("useRelease must be used inside <ReleaseProvider>.");
  return value;
}
