import type { TokenStore } from "./token-store";

export type { TokenStore };

/**
 * The web version's session token. A browser has no Keychain, so it lives
 * in this site's localStorage — the same place a signed-in website keeps
 * it — readable only by pages on this origin. Signing out clears it.
 */

const KEY = "mugabe-fitness.session-token";

export const secureTokenStore: TokenStore = {
  async get() {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      // Storage blocked (e.g. some private modes): treated as signed out.
      return null;
    }
  },

  async set(token) {
    window.localStorage.setItem(KEY, token);
  },

  async clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Nothing stored to remove.
    }
  },
};
