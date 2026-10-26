import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ApiFailure } from "@/api/client";
import { dailyApi as defaultDailyApi, type DailyApi, type DailyData, type DailyLoad } from "@/api/daily";
import { useAuth } from "@/auth/AuthProvider";
import type { DayPayload } from "@/lib/daily";

/**
 * The signed-in client's daily log, shared by the Progress tab and the
 * log/edit screen so a save in one shows in the other at once.
 *
 * The screen only ever shows what the server returned — saves are not
 * applied optimistically. A 401 is handed to the auth provider, which asks
 * the server and signs out only if the session really ended. A 403 means
 * the trial or paid month has lapsed: the data stays on the server and the
 * app shows a locked state instead of a form.
 */

export type DailyState =
  /** Not signed in, so there is nothing to load. */
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      data: DailyLoad;
      refreshing: boolean;
      /** A background refresh that failed; the last good data stays. */
      refreshFailure: ApiFailure | null;
    }
  /** 403: trial or paid month lapsed. */
  | { status: "locked"; message: string }
  /** The first load failed: offline, timeout, server error. */
  | { status: "error"; failure: ApiFailure };

export type WriteResult = { ok: true } | { ok: false; failure: ApiFailure };

type DailyContextValue = {
  state: DailyState;
  /** Re-reads the log; keeps what's on screen if it fails. */
  refresh(): Promise<void>;
  save(day: DayPayload): Promise<WriteResult>;
  remove(on: string): Promise<WriteResult>;
};

const DailyContext = createContext<DailyContextValue | null>(null);

export function DailyProvider({
  children,
  dailyApi = defaultDailyApi,
}: {
  children: ReactNode;
  dailyApi?: DailyApi;
}) {
  const auth = useAuth();
  const token = auth.state.status === "signedIn" ? auth.state.token : null;
  const recheckSession = auth.refresh;

  const [state, setState] = useState<DailyState>(token ? { status: "loading" } : { status: "idle" });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // A new sign-in starts from loading; signing out clears the data.
  // Adjusted during render so the old account's log never flashes.
  if (token !== loadedFor) {
    setLoadedFor(token);
    setState(token ? { status: "loading" } : { status: "idle" });
  }

  // Answers to loads made under an older token, or overtaken by a save,
  // are ignored.
  const generation = useRef(0);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
    generation.current++;
  }, [token]);

  /** What every call does with a failure that isn't the caller's to show. */
  const handleFailure = useCallback(
    (failure: ApiFailure): boolean => {
      if (failure.kind === "unauthorized") {
        // The server has the final say: re-check, and the auth provider
        // signs out (with a notice) only if the session really ended.
        void recheckSession();
        return true;
      }

      if (failure.kind === "forbidden") {
        setState({ status: "locked", message: failure.message });
        return true;
      }

      return false;
    },
    [recheckSession],
  );

  /** What a finished load does to the screen. */
  const applyLoad = useCallback(
    (result: Awaited<ReturnType<DailyApi["load"]>>) => {
      if (result.ok) {
        setState({ status: "ready", data: result.data, refreshing: false, refreshFailure: null });
        return;
      }

      if (handleFailure(result)) return;

      // A failed refresh keeps what is on screen; a failed first load
      // has nothing to keep.
      setState((current) =>
        current.status === "ready"
          ? { ...current, refreshing: false, refreshFailure: result }
          : { status: "error", failure: result },
      );
    },
    [handleFailure],
  );

  // The first load for this session. State is only set when the answer
  // arrives, never synchronously inside the effect.
  useEffect(() => {
    if (!token) return;

    const gen = ++generation.current;

    void dailyApi.load(token).then((result) => {
      if (gen === generation.current) applyLoad(result);
    });
  }, [token, dailyApi, applyLoad]);

  const refresh = useCallback(async () => {
    if (!token) return;

    const gen = ++generation.current;

    setState((current) =>
      current.status === "ready" ? { ...current, refreshing: true } : { status: "loading" },
    );

    const result = await dailyApi.load(token);

    if (gen === generation.current) applyLoad(result);
  }, [token, dailyApi, applyLoad]);

  const applyWrite = useCallback(
    (data: DailyData) => {
      setState((current) =>
        current.status === "ready"
          ? { status: "ready", data: { ...current.data, ...data }, refreshing: false, refreshFailure: null }
          : current,
      );
    },
    [],
  );

  const write = useCallback(
    async (call: (token: string) => ReturnType<DailyApi["save"]>): Promise<WriteResult> => {
      if (!token) {
        return { ok: false, failure: { ok: false, kind: "unauthorized", status: 0, message: "Please sign in again." } };
      }

      const result = await call(token);

      // Signed out (or in as someone else) while it was out: report what
      // the server said, but don't show it on another session's screen.
      if (tokenRef.current !== token) {
        return result.ok ? { ok: true } : { ok: false, failure: result };
      }

      if (result.ok) {
        // A refresh that started before this save would bring back the
        // older log; cancel it, the save's reply is newer.
        generation.current++;
        applyWrite(result.data);
        return { ok: true };
      }

      handleFailure(result);

      return { ok: false, failure: result };
    },
    [applyWrite, handleFailure, token],
  );

  const save = useCallback((day: DayPayload) => write((t) => dailyApi.save(t, day)), [dailyApi, write]);
  const remove = useCallback((on: string) => write((t) => dailyApi.remove(t, on)), [dailyApi, write]);

  const value = useMemo(() => ({ state, refresh, save, remove }), [state, refresh, save, remove]);

  return <DailyContext.Provider value={value}>{children}</DailyContext.Provider>;
}

export function useDaily() {
  const value = useContext(DailyContext);

  if (!value) throw new Error("useDaily must be used inside <DailyProvider>.");

  return value;
}
