import { apiConfig } from "./env";

/**
 * A page on the Mugabe Fitness website (the same origin the app signs in
 * against), or null when the app has no valid address configured.
 */
export function websiteUrl(path = "/"): string | null {
  return apiConfig.ok ? `${apiConfig.baseUrl}${path.startsWith("/") ? path : `/${path}`}` : null;
}
