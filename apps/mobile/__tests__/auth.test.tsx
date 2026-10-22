import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import type { Account, AccountApi } from "@/api/account";
import { failure } from "@/api/client";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import type { TokenStore } from "@/auth/token-store";

const TOKEN = "Abc_def-1234567890abcdefghijklmnop";
const USER = { id: "u-1", name: "Asha Rao", email: "asha@example.com", phone: "9876543210", createdAt: "" };
const ACCOUNT: Account = {
  user: USER,
  membership: { status: "trial", programName: "Mugabe Live", trialEndsAt: "", paidThrough: "", nextDueAt: "" },
};

type MemoryStore = TokenStore & {
  value: string | null;
  set: jest.Mock<Promise<void>, [string]>;
  clear: jest.Mock<Promise<void>, []>;
};

function memoryStore(initial: string | null = null): MemoryStore {
  const store: MemoryStore = {
    value: initial,
    get: jest.fn(async () => store.value),
    set: jest.fn(async (token: string) => {
      store.value = token;
    }),
    clear: jest.fn(async () => {
      store.value = null;
    }),
  };
  return store;
}

function fakeApi(overrides: Partial<AccountApi> = {}): jest.Mocked<AccountApi> {
  return {
    register: jest.fn(async () => ({ ok: true as const, data: { token: TOKEN, user: USER } })),
    logIn: jest.fn(async () => ({ ok: true as const, data: { token: TOKEN, user: USER } })),
    logOut: jest.fn(async () => ({ ok: true as const, data: true as const })),
    getAccount: jest.fn(async () => ({ ok: true as const, data: ACCOUNT })),
    ...overrides,
  } as jest.Mocked<AccountApi>;
}

function setup(api: AccountApi, store: TokenStore) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider accountApi={api} tokenStore={store}>
      {children}
    </AuthProvider>
  );

  // Rendering is asynchronous in React Native Testing Library 14.
  return renderHook(() => useAuth(), { wrapper });
}

describe("restoring a session on launch", () => {
  it("is signed out when the device holds no token", async () => {
    const api = fakeApi();
    const { result } = await setup(api, memoryStore());

    await waitFor(() => expect(result.current.state.status).toBe("signedOut"));
    expect(api.getAccount).not.toHaveBeenCalled();
  });

  it("counts as signed in only once the server confirms the stored token", async () => {
    const api = fakeApi();
    const { result } = await setup(api, memoryStore(TOKEN));

    await waitFor(() => expect(result.current.state.status).toBe("signedIn"));
    expect(api.getAccount).toHaveBeenCalledWith(TOKEN);
  });

  it("clears an expired token and says why", async () => {
    const store = memoryStore(TOKEN);
    const api = fakeApi({ getAccount: jest.fn(async () => failure("unauthorized", 401)) });
    const { result } = await setup(api, store);

    await waitFor(() => expect(result.current.state).toEqual({ status: "signedOut", notice: "expired" }));
    expect(store.value).toBeNull();
  });

  it("keeps the token but doesn't claim sign-in when the server can't be reached", async () => {
    const store = memoryStore(TOKEN);
    const getAccount = jest.fn().mockResolvedValueOnce(failure("network"));
    const api = fakeApi({ getAccount });
    const { result } = await setup(api, store);

    await waitFor(() => expect(result.current.state.status).toBe("unverified"));
    expect(store.value).toBe(TOKEN);

    // Back online: retrying confirms it.
    getAccount.mockResolvedValueOnce({ ok: true, data: ACCOUNT });
    await act(() => result.current.refresh());
    expect(result.current.state.status).toBe("signedIn");
  });
});

describe("signing in and out", () => {
  it("stores the token securely and confirms it with the server", async () => {
    const store = memoryStore();
    const api = fakeApi();
    const { result } = await setup(api, store);
    await waitFor(() => expect(result.current.state.status).toBe("signedOut"));

    let outcome: Awaited<ReturnType<typeof result.current.signIn>> | undefined;
    await act(async () => {
      outcome = await result.current.signIn("asha@example.com", "secret-pass");
    });

    expect(outcome).toEqual({ ok: true });
    expect(store.set).toHaveBeenCalledWith(TOKEN);
    expect(api.getAccount).toHaveBeenCalledWith(TOKEN);
    expect(result.current.state.status).toBe("signedIn");
  });

  it("stores nothing and stays signed out when the server refuses the password", async () => {
    const store = memoryStore();
    const api = fakeApi({ logIn: jest.fn(async () => failure("unauthorized", 401, "Email or password is incorrect.")) });
    const { result } = await setup(api, store);
    await waitFor(() => expect(result.current.state.status).toBe("signedOut"));

    let outcome: Awaited<ReturnType<typeof result.current.signIn>> | undefined;
    await act(async () => {
      outcome = await result.current.signIn("asha@example.com", "wrong-pass");
    });

    expect(outcome).toMatchObject({ ok: false, failure: { message: "Email or password is incorrect." } });
    expect(store.set).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("signedOut");
  });

  it("registers through the same secure path", async () => {
    const store = memoryStore();
    const api = fakeApi();
    const { result } = await setup(api, store);
    await waitFor(() => expect(result.current.state.status).toBe("signedOut"));

    await act(async () => {
      await result.current.register({ name: "Asha", email: "asha@example.com", phone: "9876543210", password: "longenough" });
    });

    expect(api.register).toHaveBeenCalled();
    expect(store.value).toBe(TOKEN);
    expect(result.current.state.status).toBe("signedIn");
  });

  it("signs out on the device even when the server can't be reached", async () => {
    const store = memoryStore(TOKEN);
    const api = fakeApi({ logOut: jest.fn(async () => failure("network")) });
    const { result } = await setup(api, store);
    await waitFor(() => expect(result.current.state.status).toBe("signedIn"));

    await act(() => result.current.signOut());

    expect(store.value).toBeNull();
    expect(result.current.state).toEqual({ status: "signedOut" });
    expect(api.logOut).toHaveBeenCalledWith(TOKEN);
  });
});
