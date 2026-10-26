import {
  normalizeDailyLog,
  normalizeTargets,
  normalizeWeights,
  type DailyEntry,
  type DayPayload,
  type Targets,
  type WeightEntry,
} from "@/lib/daily";
import { api, type ApiClient, type ApiResult } from "./client";

/**
 * The website's daily-tracking routes, called from the app. Verified
 * against `src/app/api/account/daily/route.ts` in the repository root:
 *
 * - GET    /api/account/daily          -> { log, targets, progress }
 * - POST   /api/account/daily          -> { log, progress }   (no targets)
 * - DELETE /api/account/daily?on=DATE  -> { log, progress }
 *
 * Every call is the signed-in client acting on their own record; the
 * server takes the user from the bearer token, never from the body.
 * 401 = session ended, 403 = trial or paid month lapsed, 429 = more than
 * 60 changes in an hour, 409 = log full, 400 = refused input.
 */

export type DailyData = {
  log: DailyEntry[];
  /** Weigh-ins from the website's weight log, newest first. */
  weights: WeightEntry[];
};

export type DailyLoad = DailyData & { targets: Targets };

function asObject(input: unknown): Record<string, unknown> | null {
  return input && typeof input === "object" && !Array.isArray(input)
    ? (input as Record<string, unknown>)
    : null;
}

/** A 2xx without the expected arrays is treated as unexpected, never as
 *  an empty log the user might then "save over". */
export function parseDailyData(json: unknown): DailyData | null {
  const body = asObject(json);
  const progress = asObject(body?.progress);

  if (!body || !Array.isArray(body.log) || !progress || !Array.isArray(progress.entries)) {
    return null;
  }

  return { log: normalizeDailyLog(body.log), weights: normalizeWeights(progress) };
}

export function parseDailyLoad(json: unknown): DailyLoad | null {
  const data = parseDailyData(json);

  return data ? { ...data, targets: normalizeTargets(asObject(json)?.targets) } : null;
}

export function createDailyApi(request: ApiClient = api) {
  return {
    load(token: string): Promise<ApiResult<DailyLoad>> {
      return request({ method: "GET", path: "/api/account/daily", token, parse: parseDailyLoad });
    },

    /** Saves the whole day as the form shows it. weightGrams: a number
     *  saves that day's weigh-in, null removes it. */
    save(token: string, day: DayPayload): Promise<ApiResult<DailyData>> {
      return request({
        method: "POST",
        path: "/api/account/daily",
        token,
        body: day,
        parse: parseDailyData,
      });
    },

    /** Removes the whole day, its weigh-in included. */
    remove(token: string, on: string): Promise<ApiResult<DailyData>> {
      return request({
        method: "DELETE",
        path: `/api/account/daily?on=${encodeURIComponent(on)}`,
        token,
        parse: parseDailyData,
      });
    },
  };
}

export type DailyApi = ReturnType<typeof createDailyApi>;

export const dailyApi = createDailyApi();
