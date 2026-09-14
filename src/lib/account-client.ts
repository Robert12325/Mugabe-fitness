import {
  normalizeAccountBooking,
  normalizeAccountUser,
  type AccountBooking,
  type AccountUser,
  type Registration,
} from "@/lib/account";
import { readError } from "@/lib/enquiries-client";
import { createLocalStore } from "@/lib/local-store";

/* ------------------------------------------------------------------ */
/* Session                                                             */
/*                                                                     */
/* The visitor's session token lives in localStorage, so they stay      */
/* signed in across tabs and visits until they log out or it expires    */
/* on the server (30 days).                                             */
/* ------------------------------------------------------------------ */

export type Session = { token: string; user: AccountUser };

function parseSession(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;

  const { token, user } = raw as Record<string, unknown>;
  const parsedUser = normalizeAccountUser(user);

  return typeof token === "string" && token && parsedUser
    ? { token, user: parsedUser }
    : null;
}

const sessionStore = createLocalStore("mugabe-fitness:account", parseSession);

export const subscribeSession = sessionStore.subscribe;
export const getSession = sessionStore.get;
export const getSessionOnServer = sessionStore.getServer;

export function authHeader(session: Session | null): Record<string, string> {
  return session ? { Authorization: `Bearer ${session.token}` } : {};
}

export type AuthResult =
  | { ok: true; session: Session }
  | { ok: false; message: string };

async function authenticate(url: string, body: unknown): Promise<AuthResult> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      message: "You appear to be offline. Check your connection and try again.",
    };
  }

  if (!response.ok) return { ok: false, message: await readError(response) };

  const session = parseSession(await response.json().catch(() => null));

  if (!session) {
    return { ok: false, message: "Unexpected response. Please try again." };
  }

  sessionStore.set(session);

  return { ok: true, session };
}

export function register(input: Registration) {
  return authenticate("/api/account", input);
}

export function logIn(email: string, password: string) {
  return authenticate("/api/account/session", { email, password });
}

export async function logOut(session: Session) {
  // Forget it here first, so the screen changes at once even offline.
  sessionStore.clear();

  try {
    await fetch("/api/account/session", {
      method: "DELETE",
      headers: authHeader(session),
    });
  } catch {
    // The server session expires on its own.
  }
}

/* ------------------------------------------------------------------ */
/* Account data                                                        */
/* ------------------------------------------------------------------ */

export type AccountLoad =
  | { state: "ok"; user: AccountUser; bookings: AccountBooking[] }
  | { state: "signed-out" }
  | { state: "offline" }
  | { state: "error" };

export async function fetchAccount(token: string): Promise<AccountLoad> {
  try {
    const response = await fetch("/api/account", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (response.status === 401) {
      // Expired, or ended elsewhere. Only forget it if it is still the
      // session that was asked about — not one signed in since.
      if (getSession()?.token === token) sessionStore.clear();

      return { state: "signed-out" };
    }

    if (response.status === 503) return { state: "offline" };
    if (!response.ok) return { state: "error" };

    const body = (await response.json()) as {
      user?: unknown;
      bookings?: unknown;
    };

    const user = normalizeAccountUser(body.user);

    if (!user) return { state: "error" };

    const bookings = (Array.isArray(body.bookings) ? body.bookings : [])
      .map(normalizeAccountBooking)
      .filter((booking): booking is AccountBooking => booking !== null);

    return { state: "ok", user, bookings };
  } catch {
    return { state: "error" };
  }
}
