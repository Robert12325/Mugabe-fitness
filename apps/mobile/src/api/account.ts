import { api, failure, type ApiClient, type ApiResult } from "./client";

/**
 * The account routes the website already uses, called from the app.
 * Shapes and rules mirror the server code in the main project:
 *
 * - POST   /api/account          register  -> 201 { user, token }
 * - POST   /api/account/session  log in    -> 200 { user, token }
 * - DELETE /api/account/session  log out   -> 200 { ok: true }
 * - GET    /api/account          account   -> 200 { user, bookings, membership }
 *
 * See `src/app/api/account/route.ts`, `src/app/api/account/session/route.ts`
 * and `src/lib/account.ts` in the repository root.
 */

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
};

/**
 * The coaching membership the server worked out. Shown for information
 * only: it is *not* an entitlement to premium app content, which will need
 * its own server-side check when that content exists.
 */
export type CoachingMembership = {
  status: "none" | "trial" | "paid" | "due" | "expired";
  programName: string;
  trialEndsAt: string;
  paidThrough: string;
  nextDueAt: string;
};

export type Account = {
  user: AccountUser;
  membership: CoachingMembership;
};

export type Session = { token: string; user: AccountUser };

/* ------------------------------------------------------------------ */
/* Reading what the server sends                                       */
/* ------------------------------------------------------------------ */

function asObject(input: unknown): Record<string, unknown> | null {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : null;
}

function text(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? (body[key] as string) : "";
}

export function parseUser(input: unknown): AccountUser | null {
  const body = asObject(input);

  if (!body || typeof body.id !== "string" || typeof body.email !== "string") {
    return null;
  }

  return {
    id: body.id,
    name: text(body, "name"),
    email: body.email,
    phone: text(body, "phone"),
    createdAt: text(body, "createdAt"),
  };
}

/** The server's bearer-token pattern: what it will accept back. */
const TOKEN = /^[A-Za-z0-9_-]{20,100}$/;

export function parseSession(input: unknown): Session | null {
  const body = asObject(input);
  const user = parseUser(body?.user);
  const token = body && typeof body.token === "string" ? body.token : "";

  return user && TOKEN.test(token) ? { token, user } : null;
}

const STATUSES: CoachingMembership["status"][] = ["none", "trial", "paid", "due", "expired"];

function parseMembership(input: unknown): CoachingMembership {
  const body = asObject(input) ?? {};
  const status = STATUSES.includes(body.status as CoachingMembership["status"])
    ? (body.status as CoachingMembership["status"])
    : "none";

  return {
    status,
    programName: text(body, "programName"),
    trialEndsAt: text(body, "trialEndsAt"),
    paidThrough: text(body, "paidThrough"),
    nextDueAt: text(body, "nextDueAt"),
  };
}

export function parseAccount(input: unknown): Account | null {
  const body = asObject(input);
  const user = parseUser(body?.user);

  return user ? { user, membership: parseMembership(body?.membership) } : null;
}

/* ------------------------------------------------------------------ */
/* Checking input before sending it (same rules as the server)          */
/* ------------------------------------------------------------------ */

export const PASSWORD_MIN = 8;
const PASSWORD_MAX = 200;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Registration = { name: string; email: string; phone: string; password: string };

export type FieldErrors = Partial<Record<keyof Registration, string>>;

/** Emails are matched case-insensitively on the server. */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function checkRegistration(input: Registration): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  const phone = input.phone.trim();
  const digits = phone.replace(/\D/g, "").length;

  if (!name) errors.name = "Please enter your name.";
  else if (name.length > 100) errors.name = "That name is too long.";

  if (phone.length > 30 || digits < 7 || digits > 15) {
    errors.phone = "Please enter a valid phone number.";
  }

  const email = normalizeEmail(input.email);
  if (email.length > 200 || !EMAIL.test(email)) errors.email = "Please enter a valid email.";

  if (input.password.length < PASSWORD_MIN) {
    errors.password = `Use at least ${PASSWORD_MIN} characters.`;
  } else if (input.password.length > PASSWORD_MAX) {
    errors.password = "That password is too long.";
  }

  return errors;
}

export function checkCredentials(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const normalized = normalizeEmail(email);

  if (normalized.length > 200 || !EMAIL.test(normalized)) errors.email = "Please enter a valid email.";
  if (!password || password.length > PASSWORD_MAX) errors.password = "Enter your password.";

  return errors;
}

/* ------------------------------------------------------------------ */
/* Calls                                                               */
/* ------------------------------------------------------------------ */

export function createAccountApi(request: ApiClient = api) {
  return {
    register(input: Registration): Promise<ApiResult<Session>> {
      return request({
        method: "POST",
        path: "/api/account",
        body: {
          name: input.name.trim(),
          email: normalizeEmail(input.email),
          phone: input.phone.trim(),
          // Passwords are sent exactly as typed, spaces included.
          password: input.password,
        },
        parse: parseSession,
      });
    },

    logIn(email: string, password: string): Promise<ApiResult<Session>> {
      return request({
        method: "POST",
        path: "/api/account/session",
        body: { email: normalizeEmail(email), password },
        parse: parseSession,
      });
    },

    /** Ends the session on the server. The caller forgets the token
     *  locally whatever this returns. */
    logOut(token: string): Promise<ApiResult<true>> {
      return request({
        method: "DELETE",
        path: "/api/account/session",
        token,
        parse: () => true,
        timeoutMs: 8_000,
      });
    },

    getAccount(token: string): Promise<ApiResult<Account>> {
      if (!TOKEN.test(token)) return Promise.resolve(failure("unauthorized", 0));

      return request({ method: "GET", path: "/api/account", token, parse: parseAccount });
    },
  };
}

export type AccountApi = ReturnType<typeof createAccountApi>;

export const accountApi = createAccountApi();
