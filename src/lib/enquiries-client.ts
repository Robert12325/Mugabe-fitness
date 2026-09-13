import type { Lead, LeadStatus } from "@/lib/types";

/** How the admin dashboard is connected to the enquiry server. */
export type ServerState = "loading" | "online" | "offline" | "error";

async function readError(response: Response) {
  try {
    const body: unknown = await response.json();

    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
    ) {
      return (body as { error: string }).error;
    }
  } catch {
    // Not JSON — fall through to the generic message.
  }

  return `Request failed (${response.status}).`;
}

/* ------------------------------------------------------------------ */
/* Public form                                                         */
/* ------------------------------------------------------------------ */

export type EnquiryPayload = {
  name: string;
  email: string;
  phone: string;
  programId: string;
  slot: string;
  goal: string;
  message: string;
  /** Honeypot — always empty for real visitors. */
  company: string;
};

export type SubmitResult =
  | { ok: true }
  | {
      ok: false;
      kind: "invalid" | "rate" | "unavailable" | "network";
      message: string;
    };

export async function submitEnquiry(
  payload: EnquiryPayload,
): Promise<SubmitResult> {
  let response: Response;

  try {
    response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      ok: false,
      kind: "network",
      message:
        "You appear to be offline. Check your connection and try again.",
    };
  }

  if (response.ok) return { ok: true };

  const message = await readError(response);

  if (response.status === 400) return { ok: false, kind: "invalid", message };
  if (response.status === 429) return { ok: false, kind: "rate", message };

  return { ok: false, kind: "unavailable", message };
}

/* ------------------------------------------------------------------ */
/* Admin session                                                       */
/* ------------------------------------------------------------------ */

export type SignInResult = "ok" | "wrong" | "rate" | "unconfigured" | "error";

export async function signIn(password: string): Promise<SignInResult> {
  try {
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) return "ok";
    if (response.status === 401) return "wrong";
    if (response.status === 429) return "rate";
    if (response.status === 503) return "unconfigured";

    return "error";
  } catch {
    return "error";
  }
}

export async function signOut() {
  try {
    await fetch("/api/admin/session", { method: "DELETE" });
  } catch {
    // Signing out locally still hides the dashboard; the cookie expires anyway.
  }
}

/* ------------------------------------------------------------------ */
/* Admin enquiries                                                     */
/* ------------------------------------------------------------------ */

export type LoadResult =
  | { state: "online"; enquiries: Lead[] }
  | { state: "offline" }
  | { state: "unauthorized" }
  | { state: "error"; message: string };

export async function loadEnquiries(): Promise<LoadResult> {
  try {
    const response = await fetch("/api/enquiries", { cache: "no-store" });

    if (response.status === 503) return { state: "offline" };
    if (response.status === 401) return { state: "unauthorized" };

    if (!response.ok) {
      return { state: "error", message: await readError(response) };
    }

    const body = (await response.json()) as { enquiries?: unknown };

    return {
      state: "online",
      enquiries: Array.isArray(body.enquiries)
        ? (body.enquiries as Lead[])
        : [],
    };
  } catch {
    return { state: "error", message: "Could not reach the server." };
  }
}

async function send(method: string, url: string, body?: unknown) {
  try {
    const response = await fetch(url, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function patchEnquiry(
  id: string,
  patch: { status?: LeadStatus; notes?: string },
) {
  return send("PATCH", `/api/enquiries/${encodeURIComponent(id)}`, patch);
}

export function removeEnquiry(id: string) {
  return send("DELETE", `/api/enquiries/${encodeURIComponent(id)}`);
}

export function removeAllEnquiries() {
  return send("DELETE", "/api/enquiries");
}
