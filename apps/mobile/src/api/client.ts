import { apiConfig, type ApiConfig } from "@/config/env";

/**
 * A small JSON client for the existing Mugabe Fitness backend.
 *
 * The backend already speaks a mobile-friendly protocol: sessions are
 * random tokens sent as `Authorization: Bearer <token>`, not cookies, and
 * every error is `{ "error": "<message>" }`. So the app talks to the same
 * routes as the website, unchanged.
 *
 * Every call resolves — it never throws — to either the parsed data or a
 * classified failure, so screens can't forget to handle one.
 */

export type FailureKind =
  /** EXPO_PUBLIC_API_URL is missing or unsafe. */
  | "config"
  /** No connection, DNS failure, TLS failure. */
  | "network"
  | "timeout"
  /** 401: wrong credentials, or the session expired or was revoked. */
  | "unauthorized"
  /** 400: the server refused the input. */
  | "invalid"
  /** 409: e.g. an account already exists for that email. */
  | "conflict"
  /** 429: too many attempts from this network. */
  | "rate-limited"
  /** 503: the backend is up but its storage isn't configured. */
  | "unavailable"
  /** Any other 5xx. */
  | "server"
  /** A 2xx body that didn't have the expected shape, or any other status. */
  | "unexpected";

export type ApiFailure = {
  ok: false;
  kind: FailureKind;
  /** 0 when no HTTP response arrived. */
  status: number;
  /** Safe to show the user. */
  message: string;
};

export type ApiResult<T> = { ok: true; data: T } | ApiFailure;

const FALLBACK_MESSAGE: Record<FailureKind, string> = {
  config: "The app isn't configured to reach the server.",
  network: "You appear to be offline. Check your connection and try again.",
  timeout: "The server took too long to answer. Please try again.",
  unauthorized: "Please sign in again.",
  invalid: "Please check your details and try again.",
  conflict: "That already exists.",
  "rate-limited": "Too many attempts. Please wait a few minutes and try again.",
  unavailable: "This isn't available right now. Please try again later.",
  server: "Something went wrong on our side. Please try again.",
  unexpected: "Unexpected response from the server. Please try again.",
};

function kindFor(status: number): FailureKind {
  if (status === 400) return "invalid";
  if (status === 401) return "unauthorized";
  if (status === 409) return "conflict";
  if (status === 429) return "rate-limited";
  if (status === 503) return "unavailable";
  if (status >= 500) return "server";
  return "unexpected";
}

export function failure(kind: FailureKind, status = 0, message?: string): ApiFailure {
  return { ok: false, kind, status, message: message || FALLBACK_MESSAGE[kind] };
}

export type RequestOptions<T> = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  token?: string;
  body?: unknown;
  /** Turns a 2xx JSON body into data, or null when it has the wrong shape. */
  parse: (json: unknown) => T | null;
  timeoutMs?: number;
};

export type ApiClient = <T>(options: RequestOptions<T>) => Promise<ApiResult<T>>;

/** The one shape of fetch this client uses — easy to stand in for in tests. */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export function createApiClient({
  config = apiConfig,
  fetchImpl = (url, init) => fetch(url, init),
  defaultTimeoutMs = 15_000,
}: {
  config?: ApiConfig;
  fetchImpl?: FetchLike;
  defaultTimeoutMs?: number;
} = {}): ApiClient {
  return async function request<T>({
    method,
    path,
    token,
    body,
    parse,
    timeoutMs = defaultTimeoutMs,
  }: RequestOptions<T>): Promise<ApiResult<T>> {
    if (!config.ok) return failure("config", 0, config.problem);

    const headers: Record<string, string> = { Accept: "application/json" };

    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;

    try {
      response = await fetchImpl(config.baseUrl + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      return failure(controller.signal.aborted ? "timeout" : "network");
    } finally {
      clearTimeout(timer);
    }

    const json: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const serverMessage =
        json && typeof json === "object" && typeof (json as { error?: unknown }).error === "string"
          ? (json as { error: string }).error
          : "";

      return failure(kindFor(response.status), response.status, serverMessage);
    }

    const data = parse(json);

    return data === null
      ? failure("unexpected", response.status)
      : { ok: true, data };
  };
}

export const api = createApiClient();
