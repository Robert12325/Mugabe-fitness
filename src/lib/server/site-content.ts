import type { MethodStep, Program, PublicSettings } from "@/lib/types";
import { redis } from "./redis";

const KEY = "mf:site:content";

const ID = /^[A-Za-z0-9_-]{1,64}$/;

const MAX_PROGRAMS = 24;
const MAX_STEPS = 24;
const MAX_LIST = 20;

export type SiteContent = {
  programs: Program[];
  method: MethodStep[];
  /** null when a published document predates settings being shared. */
  settings: PublicSettings | null;
};

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function asObject(input: unknown): Record<string, unknown> | null {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : null;
}

/**
 * Strict on the way in. Content is stored exactly as the dashboard sent it,
 * so a malformed field is rejected rather than quietly repaired — a repaired
 * copy would stop matching what the browser holds.
 */
function strictReader(body: Record<string, unknown>) {
  let valid = true;

  return {
    text(key: string, max: number) {
      const value = body[key];
      if (typeof value === "string" && value.length <= max) return value;
      valid = false;
      return "";
    },
    list(key: string, max: number, itemMax: number) {
      const value = body[key];

      if (
        Array.isArray(value) &&
        value.length <= max &&
        value.every(
          (item) => typeof item === "string" && item.length <= itemMax,
        )
      ) {
        return value as string[];
      }

      valid = false;
      return [];
    },
    flag(key: string) {
      const value = body[key];
      if (typeof value === "boolean") return value;
      valid = false;
      return false;
    },
    require(condition: boolean) {
      if (!condition) valid = false;
    },
    get valid() {
      return valid;
    },
  };
}

export function parseProgram(input: unknown): Program | null {
  const body = asObject(input);

  if (!body) return null;

  const read = strictReader(body);

  const program: Program = {
    id: read.text("id", 64),
    number: read.text("number", 8),
    name: read.text("name", 80),
    subtitle: read.text("subtitle", 120),
    price: read.text("price", 24),
    period: read.text("period", 24),
    description: read.text("description", 600),
    features: read.list("features", MAX_LIST, 120),
    slots: read.list("slots", MAX_LIST, 40),
    featured: read.flag("featured"),
    active: read.flag("active"),
  };

  read.require(ID.test(program.id));

  return read.valid ? program : null;
}

export function parseMethodStep(input: unknown): MethodStep | null {
  const body = asObject(input);

  if (!body) return null;

  const read = strictReader(body);

  const step: MethodStep = {
    id: read.text("id", 64),
    number: read.text("number", 8),
    title: read.text("title", 60),
    text: read.text("text", 400),
  };

  read.require(ID.test(step.id));

  return read.valid ? step : null;
}

export function parsePublicSettings(input: unknown): PublicSettings | null {
  const body = asObject(input);

  if (!body) return null;

  const read = strictReader(body);

  const settings: PublicSettings = {
    brandName: read.text("brandName", 40),
    brandSuffix: read.text("brandSuffix", 40),
    tagline: read.text("tagline", 120),
    coachEmail: read.text("coachEmail", 254),
    coachPhone: read.text("coachPhone", 40),
  };

  return read.valid ? settings : null;
}

export function parseSiteContent(input: unknown): Parsed<SiteContent> {
  const body = asObject(input);

  if (!body) return { ok: false, error: "Invalid request." };

  const rawPrograms = body.programs;
  const rawMethod = body.method;

  if (!Array.isArray(rawPrograms) || !Array.isArray(rawMethod)) {
    return { ok: false, error: "Programs and method must both be lists." };
  }

  if (rawPrograms.length > MAX_PROGRAMS || rawMethod.length > MAX_STEPS) {
    return { ok: false, error: "Too many programs or steps." };
  }

  const programs: Program[] = [];

  for (const [index, raw] of rawPrograms.entries()) {
    const program = parseProgram(raw);

    if (!program) {
      const name = asObject(raw)?.name;
      const label =
        typeof name === "string" && name.trim()
          ? `"${name.trim().slice(0, 40)}"`
          : `#${index + 1}`;

      return {
        ok: false,
        error: `Program ${label} has a value the server can't accept.`,
      };
    }

    programs.push(program);
  }

  const method: MethodStep[] = [];

  for (const [index, raw] of rawMethod.entries()) {
    const step = parseMethodStep(raw);

    if (!step) {
      return {
        ok: false,
        error: `Method step #${index + 1} has a value the server can't accept.`,
      };
    }

    method.push(step);
  }

  // Two programs sharing an id would collide in the dashboard.
  const ids = new Set(programs.map((program) => program.id));

  if (ids.size !== programs.length) {
    return { ok: false, error: "Two programs share the same id." };
  }

  let settings: PublicSettings | null = null;

  if (body.settings !== undefined && body.settings !== null) {
    settings = parsePublicSettings(body.settings);

    if (!settings) {
      return { ok: false, error: "Those site details can't be saved." };
    }
  }

  return { ok: true, value: { programs, method, settings } };
}

/** null means the coach has never published content; the site then shows the
 *  built-in programs and steps that ship in the code. */
export async function getSiteContent(): Promise<SiteContent | null> {
  const raw = await redis<unknown>("GET", KEY);

  if (typeof raw !== "string") return null;

  try {
    const parsed = parseSiteContent(JSON.parse(raw));

    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}

export async function setSiteContent(content: SiteContent) {
  await redis("SET", KEY, JSON.stringify(content));

  return content;
}
