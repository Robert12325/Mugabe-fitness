import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import {
  normalizeAccountUser,
  type AccountBooking,
  type AccountUser,
  type Credentials,
  type Registration,
} from "@/lib/account";
import {
  ENQUIRY_TOKEN_HEADER,
  getEnquiry,
  listUserEnquiries,
  tokenMatches,
} from "./enquiry";
import { rateLimit, redis } from "./redis";

/** user id -> JSON (profile + password hash). */
const USERS = "mf:users";
/** normalised email -> user id. */
const EMAILS = "mf:user-emails";
/** + sha256(session token) -> user id, expiring on its own. */
const SESSION_PREFIX = "mf:user-session:";

const SESSION_SECONDS = 30 * 24 * 60 * 60;

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

type ScryptParams = typeof SCRYPT;

type StoredUser = AccountUser & { passwordHash: string };

function deriveKey(password: string, salt: Buffer, params: ScryptParams) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, params, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/**
 * `scrypt$N$r$p$salt$hash`. The cost parameters travel with each hash, so
 * they can be raised later without locking out existing accounts.
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, SCRYPT);

  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

async function passwordMatches(password: string, stored: string) {
  const parts = stored.split("$");

  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, "base64url");

  const actual = await deriveKey(password, Buffer.from(salt, "base64url"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

let dummyHash: Promise<string> | null = null;

/** Checked against when an email has no account, so a wrong email takes as
 *  long as a wrong password and response time can't reveal who signed up. */
function timingDecoy() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));

  return dummyHash;
}

function readStoredUser(raw: unknown): StoredUser | null {
  if (typeof raw !== "string") return null;

  try {
    const body = JSON.parse(raw) as { passwordHash?: unknown };
    const user = normalizeAccountUser(body);

    if (!user || typeof body.passwordHash !== "string") return null;

    return { ...user, passwordHash: body.passwordHash };
  } catch {
    return null;
  }
}

/** Never lets the password hash leave the server. */
function publicUser(user: StoredUser): AccountUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

function sessionKey(token: string) {
  return SESSION_PREFIX + createHash("sha256").update(token).digest("hex");
}

async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");

  // Only the hash is stored: a leaked database can't be replayed as logins.
  await redis("SET", sessionKey(token), userId, "EX", SESSION_SECONDS);

  return token;
}

export type AuthResult =
  | { ok: true; user: AccountUser; token: string }
  | { ok: false; reason: "taken" | "invalid" };

export async function registerAccount(
  input: Registration,
): Promise<AuthResult> {
  const user: AccountUser = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    createdAt: new Date().toISOString(),
  };

  const passwordHash = await hashPassword(input.password);

  // HSETNX claims the email atomically, so two sign-ups racing for the same
  // address can't both succeed.
  const claimed = await redis("HSETNX", EMAILS, user.email, user.id);

  if (Number(claimed) !== 1) return { ok: false, reason: "taken" };

  try {
    await redis("HSET", USERS, user.id, JSON.stringify({ ...user, passwordHash }));
  } catch (cause) {
    // Release the email, or it would stay claimed by an account that
    // doesn't exist.
    await redis("HDEL", EMAILS, user.email).catch(() => {});
    throw cause;
  }

  return { ok: true, user, token: await startSession(user.id) };
}

export async function loginAccount({
  email,
  password,
}: Credentials): Promise<AuthResult> {
  const id = await redis<unknown>("HGET", EMAILS, email);

  const stored =
    typeof id === "string"
      ? readStoredUser(await redis<unknown>("HGET", USERS, id))
      : null;

  const matches = await passwordMatches(
    password,
    stored?.passwordHash ?? (await timingDecoy()),
  );

  if (!stored || !matches) return { ok: false, reason: "invalid" };

  return {
    ok: true,
    user: publicUser(stored),
    token: await startSession(stored.id),
  };
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec(header);

  return match?.[1] ?? "";
}

/** The signed-in visitor, or null for a guest or an expired session. */
export async function userFromRequest(
  request: Request,
): Promise<AccountUser | null> {
  const token = bearerToken(request);

  if (!token) return null;

  const id = await redis<unknown>("GET", sessionKey(token));

  if (typeof id !== "string") return null;

  const stored = readStoredUser(await redis<unknown>("HGET", USERS, id));

  return stored ? publicUser(stored) : null;
}

export async function endSession(request: Request) {
  const token = bearerToken(request);

  if (token) await redis("DEL", sessionKey(token));
}

export async function listBookings(userId: string): Promise<AccountBooking[]> {
  const enquiries = await listUserEnquiries(userId);

  return enquiries.map((lead) => ({
    id: lead.id,
    programId: lead.programId,
    slot: lead.slot,
    goal: lead.goal,
    createdAt: lead.createdAt,
    payment: lead.payment,
  }));
}

/**
 * Whoever sent an enquiry may pay for it and follow it: with the token handed
 * back when it was sent, or — if it was sent while signed in — with that
 * account's session, from any device.
 */
export async function canAccessEnquiry(request: Request, id: string) {
  const token = request.headers.get(ENQUIRY_TOKEN_HEADER) ?? "";

  if (token && (await tokenMatches(id, token))) return true;

  const user = await userFromRequest(request);

  if (!user) return false;

  const enquiry = await getEnquiry(id);

  return enquiry !== null && enquiry.userId === user.id;
}

export function allowRegistration(ip: string) {
  return rateLimit(`mf:rl:register:${ip}`, 5, 60 * 60);
}

export function allowLogin(ip: string) {
  return rateLimit(`mf:rl:login:${ip}`, 10, 15 * 60);
}
