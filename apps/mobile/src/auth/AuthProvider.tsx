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
import {
  accountApi as defaultAccountApi,
  type Account,
  type AccountApi,
  type Registration,
} from "@/api/account";
import { failure, type ApiFailure } from "@/api/client";
import { secureTokenStore, type TokenStore } from "./token-store";

/**
 * Who is signed in, as the server sees it.
 *
 * A stored token is only a claim. On launch — and whenever asked — the app
 * checks it with GET /api/account, and only a successful answer counts as
 * signed in. A 401 at any point (expired, or signed out on another device)
 * clears the token. If the server can't be reached, the app says so and
 * keeps the token for a retry, rather than guessing either way.
 */

export type AuthState =
  /** Reading the device's token and checking it with the server. */
  | { status: "restoring" }
  | {
      status: "signedOut";
      /** Set when the server ended the session, so the app can say why. */
      notice?: "expired";
    }
  | { status: "signedIn"; token: string; account: Account }
  /** A token exists but the server couldn't be asked about it. */
  | { status: "unverified"; token: string; failure: ApiFailure };

export type AuthResult = { ok: true } | { ok: false; failure: ApiFailure };

type AuthContextValue = {
  state: AuthState;
  signIn(email: string, password: string): Promise<AuthResult>;
  register(input: Registration): Promise<AuthResult>;
  signOut(): Promise<void>;
  /** Permanently deletes the signed-in account, then signs out. */
  deleteAccount(password: string): Promise<AuthResult>;
  /** Re-checks the session and re-reads the account. */
  refresh(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  accountApi = defaultAccountApi,
  tokenStore = secureTokenStore,
}: {
  children: ReactNode;
  accountApi?: AccountApi;
  tokenStore?: TokenStore;
}) {
  const [state, setState] = useState<AuthState>({ status: "restoring" });

  // Bumped on every sign-in and sign-out, so an answer to an older request
  // can never overwrite what happened since.
  const generation = useRef(0);

  const verify = useCallback(
    async (token: string, gen: number) => {
      const result = await accountApi.getAccount(token);

      if (gen !== generation.current) return;

      if (result.ok) {
        setState({ status: "signedIn", token, account: result.data });
        return;
      }

      if (result.kind === "unauthorized") {
        await tokenStore.clear();
        if (gen !== generation.current) return;
        setState({ status: "signedOut", notice: "expired" });
        return;
      }

      setState({ status: "unverified", token, failure: result });
    },
    [accountApi, tokenStore],
  );

  useEffect(() => {
    const gen = generation.current;

    void (async () => {
      const token = await tokenStore.get();

      if (gen !== generation.current) return;

      if (!token) {
        setState({ status: "signedOut" });
        return;
      }

      await verify(token, gen);
    })();
  }, [tokenStore, verify]);

  const startSession = useCallback(
    async (
      call: () => ReturnType<AccountApi["logIn"]>,
    ): Promise<AuthResult> => {
      const gen = ++generation.current;
      const result = await call();

      if (!result.ok) return { ok: false, failure: result };
      if (gen !== generation.current) return { ok: true };

      try {
        await tokenStore.set(result.data.token);
      } catch {
        // The account exists and the server issued a session, but the
        // device wouldn't keep it. Say so rather than pretend.
        return {
          ok: false,
          failure: {
            ok: false,
            kind: "unexpected",
            status: 0,
            message: "Signed in, but this device couldn't save the session securely. Please try again.",
          },
        };
      }

      // The server's answer to GET /api/account is what makes it signed in.
      await verify(result.data.token, gen);

      return { ok: true };
    },
    [tokenStore, verify],
  );

  const signIn = useCallback(
    (email: string, password: string) => startSession(() => accountApi.logIn(email, password)),
    [accountApi, startSession],
  );

  const register = useCallback(
    (input: Registration) => startSession(() => accountApi.register(input)),
    [accountApi, startSession],
  );

  const signOut = useCallback(async () => {
    const token =
      state.status === "signedIn" || state.status === "unverified" ? state.token : null;

    generation.current++;

    // Forget it on the device first, so the screen changes at once even
    // offline; then end it on the server, which also expires it on its own.
    await tokenStore.clear();
    setState({ status: "signedOut" });

    if (token) await accountApi.logOut(token);
  }, [accountApi, state, tokenStore]);

  const deleteAccount = useCallback(
    async (password: string): Promise<AuthResult> => {
      if (state.status !== "signedIn") return { ok: false, failure: failure("unauthorized", 0) };

      const result = await accountApi.deleteAccount(state.token, password);

      // Deleted, or the session had already ended: either way, signed out.
      if (result.ok || result.kind === "unauthorized") {
        generation.current++;
        await tokenStore.clear();
        setState(result.ok ? { status: "signedOut" } : { status: "signedOut", notice: "expired" });
      }

      return result.ok ? { ok: true } : { ok: false, failure: result };
    },
    [accountApi, state, tokenStore],
  );

  const refresh = useCallback(async () => {
    if (state.status !== "signedIn" && state.status !== "unverified") return;

    await verify(state.token, generation.current);
  }, [state, verify]);

  const value = useMemo(
    () => ({ state, signIn, register, signOut, deleteAccount, refresh }),
    [state, signIn, register, signOut, deleteAccount, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");

  return value;
}
