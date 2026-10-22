/**
 * Where the app finds the existing Mugabe Fitness backend.
 *
 * Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` (see `.env.example`).
 * Only `EXPO_PUBLIC_` variables reach the app, and they ship in plain text
 * inside it — so this file holds a public URL and nothing else. Never put
 * a key, token or password in an `EXPO_PUBLIC_` variable.
 *
 * There is deliberately no fallback: an app that quietly talks to
 * production because a variable was missing is how test accounts end up in
 * the live database. A missing or unsafe value shows an error instead.
 */

export type ApiConfig =
  | { ok: true; baseUrl: string }
  | { ok: false; problem: string };

/** Hosts a phone or simulator reaches over plain http while developing. */
function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "10.0.2.2" || // the Android emulator's name for the host
    /^192\.168\.\d+\.\d+$/.test(hostname) ||
    /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname)
  );
}

export function readApiConfig(
  raw: string | undefined,
  isDev: boolean,
): ApiConfig {
  const value = raw?.trim() ?? "";

  if (!value) {
    return {
      ok: false,
      problem:
        "EXPO_PUBLIC_API_URL is not set. Copy apps/mobile/.env.example to apps/mobile/.env and restart Expo.",
    };
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return { ok: false, problem: `EXPO_PUBLIC_API_URL is not a valid URL: ${value}` };
  }

  // Passwords and session tokens travel to this address. Plain http is
  // only tolerated for a backend on your own machine or network, and only
  // in a development build.
  const secure = url.protocol === "https:";
  const localDev = isDev && url.protocol === "http:" && isLocalHost(url.hostname);

  if (!secure && !localDev) {
    return {
      ok: false,
      problem: "EXPO_PUBLIC_API_URL must use https (http is allowed only for a local backend in development).",
    };
  }

  if (url.username || url.password || url.search || url.hash) {
    return {
      ok: false,
      problem: "EXPO_PUBLIC_API_URL should be a plain origin such as https://mugabe-fitness.vercel.app.",
    };
  }

  return { ok: true, baseUrl: url.origin + url.pathname.replace(/\/+$/, "") };
}

// Referenced literally so Expo can inline it at build time — destructuring
// or bracket access would leave it undefined.
export const apiConfig = readApiConfig(process.env.EXPO_PUBLIC_API_URL, __DEV__);
