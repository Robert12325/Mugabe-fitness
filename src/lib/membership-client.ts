import {
  normalizeMembership,
  type Membership,
  type MembershipPaymentStatus,
} from "@/lib/membership";

/** The coach's side of memberships. Every call rides the admin cookie. */

export type MemberRow = {
  userId: string;
  name: string;
  email: string;
  phone: string;
  membership: Membership;
};

export type MembersLoad =
  | { state: "online"; members: MemberRow[] }
  | { state: "offline" }
  | { state: "unauthorized" }
  | { state: "error" };

function text(body: Record<string, unknown>, key: string) {
  return typeof body[key] === "string" ? (body[key] as string) : "";
}

export async function loadMembers(): Promise<MembersLoad> {
  try {
    const response = await fetch("/api/admin/members", { cache: "no-store" });

    if (response.status === 503) return { state: "offline" };
    if (response.status === 401) return { state: "unauthorized" };
    if (!response.ok) return { state: "error" };

    const body = (await response.json()) as { members?: unknown };

    const members = (Array.isArray(body.members) ? body.members : [])
      .map((raw): MemberRow | null => {
        if (!raw || typeof raw !== "object") return null;

        const row = raw as Record<string, unknown>;

        if (!text(row, "userId")) return null;

        return {
          userId: text(row, "userId"),
          name: text(row, "name"),
          email: text(row, "email"),
          phone: text(row, "phone"),
          membership: normalizeMembership(row.membership),
        };
      })
      .filter((row): row is MemberRow => row !== null);

    return { state: "online", members };
  } catch {
    return { state: "error" };
  }
}

function paymentUrl(userId: string, paymentId: string) {
  return `/api/admin/members/${encodeURIComponent(userId)}/payments/${encodeURIComponent(paymentId)}`;
}

/** Confirm, reject, or reopen a renewal sent from a client's dashboard. */
export async function reviewRenewal(
  userId: string,
  paymentId: string,
  status: MembershipPaymentStatus,
) {
  try {
    const response = await fetch(paymentUrl(userId, paymentId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function loadRenewalScreenshot(userId: string, paymentId: string) {
  try {
    const response = await fetch(`${paymentUrl(userId, paymentId)}/screenshot`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const body = (await response.json()) as { screenshot?: unknown };

    return typeof body.screenshot === "string" ? body.screenshot : null;
  } catch {
    return null;
  }
}
