/**
 * Minimal client for Upstash Redis over its REST API.
 *
 * Plain fetch rather than an SDK: no new dependency, runs on Vercel's Node
 * runtime as-is, and the handful of commands used here need nothing more.
 *
 * Vercel's Upstash integration injects KV_REST_API_URL / KV_REST_API_TOKEN;
 * a direct Upstash setup uses UPSTASH_REDIS_REST_URL / _TOKEN. Either works.
 */

type Command = (string | number)[];

export class StorageError extends Error {}

function credentials() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

export function storageConfigured() {
  return credentials() !== null;
}

async function post(path: string, body: unknown) {
  const creds = credentials();

  if (!creds) throw new StorageError("Storage is not configured.");

  const response = await fetch(creds.url + path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `HTTP ${response.status}`;

    throw new StorageError(`Storage request failed: ${detail}`);
  }

  return payload;
}

export async function redis<T = unknown>(...command: Command): Promise<T> {
  const payload = (await post("", command)) as {
    result?: T;
    error?: string;
  } | null;

  if (!payload || payload.error) {
    throw new StorageError(payload?.error ?? "Empty storage response.");
  }

  return payload.result as T;
}

export async function pipeline(commands: Command[]) {
  const payload = (await post("/pipeline", commands)) as
    | { result?: unknown; error?: string }[]
    | null;

  if (!Array.isArray(payload)) {
    throw new StorageError("Unexpected storage pipeline response.");
  }

  return payload.map((entry) => {
    if (entry?.error) throw new StorageError(entry.error);
    return entry?.result;
  });
}

/**
 * Fixed-window limiter: at most `max` hits per `windowSeconds` for `key`.
 * EXPIRE ... NX only sets the TTL on the first hit, so the window does not
 * slide forward on every request.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number,
) {
  const [count] = await pipeline([
    ["INCR", key],
    ["EXPIRE", key, windowSeconds, "NX"],
  ]);

  return Number(count) <= max;
}
