import * as SecureStore from "expo-secure-store";

/**
 * Where the session token lives on the device: the iOS Keychain or Android
 * Keystore-backed storage, via SecureStore — never AsyncStorage or any
 * plain file.
 *
 * Only the token is kept. The account itself is always fetched from the
 * server, which decides whether the token is still good.
 */

export type TokenStore = {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
};

// SecureStore keys may only use letters, digits, ".", "-" and "_".
const KEY = "mugabe-fitness.session-token";

const OPTIONS: SecureStore.SecureStoreOptions = {
  // Readable once the phone is unlocked, and never restored onto another
  // device from an iCloud backup.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureTokenStore: TokenStore = {
  async get() {
    try {
      return await SecureStore.getItemAsync(KEY, OPTIONS);
    } catch {
      // A keychain that can't be read (rare, e.g. after a device restore)
      // is treated as signed out rather than crashing the app.
      return null;
    }
  },

  async set(token) {
    await SecureStore.setItemAsync(KEY, token, OPTIONS);
  },

  async clear() {
    try {
      await SecureStore.deleteItemAsync(KEY, OPTIONS);
    } catch {
      // Nothing stored to remove.
    }
  },
};
