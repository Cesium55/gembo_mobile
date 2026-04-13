import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { authConfig } from '@/constants/auth-config';

type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

type LoginWithEmailParams = {
  email: string;
  password: string;
};

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  loginWithEmail: (params: LoginWithEmailParams) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (input: string, init?: RequestInit) => Promise<Response>;
};

const AUTH_TOKENS_STORAGE_KEY = 'auth_tokens_v1';

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function buildUrl(baseUrl: string, path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!baseUrl) {
    throw new Error('Auth server URL is not configured. Set expo.extra.auth.serverUrl in app.json.');
  }

  if (path.startsWith('/')) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${path}`;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const baseUrl = normalizeBaseUrl(authConfig.serverUrl);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const refreshPromiseRef = useRef<Promise<AuthTokens | null> | null>(null);

  const persistTokens = useCallback(async (nextTokens: AuthTokens | null) => {
    setTokens(nextTokens);

    if (nextTokens) {
      await AsyncStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify(nextTokens));
      return;
    }

    await AsyncStorage.removeItem(AUTH_TOKENS_STORAGE_KEY);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_TOKENS_STORAGE_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as Partial<AuthTokens>;
        if (parsed.access_token && parsed.refresh_token && isMounted) {
          setTokens({ access_token: parsed.access_token, refresh_token: parsed.refresh_token });
        }
      } catch {
        if (isMounted) {
          setTokens(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const postJson = useCallback(
    async <TBody extends object, TResponse extends object>(path: string, body: TBody): Promise<TResponse> => {
      const response = await fetch(buildUrl(baseUrl, path), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await response.text();
      const data = text ? (JSON.parse(text) as TResponse | { message?: string }) : ({} as TResponse);

      if (!response.ok) {
        const message = (data as { message?: string }).message ?? `Request failed (${response.status})`;
        throw new Error(message);
      }

      return data as TResponse;
    },
    [baseUrl],
  );

  const refreshTokens = useCallback(async (): Promise<AuthTokens | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      if (!tokens?.refresh_token) {
        await persistTokens(null);
        return null;
      }

      try {
        const refreshed = await postJson<{ refresh_token: string }, AuthTokens>('/auth/refresh', {
          refresh_token: tokens.refresh_token,
        });
        await persistTokens(refreshed);
        return refreshed;
      } catch {
        await persistTokens(null);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [persistTokens, postJson, tokens?.refresh_token]);

  const loginWithEmail = useCallback(
    async ({ email, password }: LoginWithEmailParams) => {
      const nextTokens = await postJson<LoginWithEmailParams, AuthTokens>('/auth/login', { email, password });
      await persistTokens(nextTokens);
    },
    [persistTokens, postJson],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const nextTokens = await postJson<{ idToken: string }, AuthTokens>('/auth/google', { idToken });
      await persistTokens(nextTokens);
    },
    [persistTokens, postJson],
  );

  const logout = useCallback(async () => {
    await persistTokens(null);
  }, [persistTokens]);

  const authFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const makeRequest = (accessToken: string | null) => {
        const headers = new Headers(init.headers ?? {});
        if (accessToken) {
          headers.set('Authorization', `Bearer ${accessToken}`);
        }

        return fetch(buildUrl(baseUrl, input), {
          ...init,
          headers,
        });
      };

      const firstResponse = await makeRequest(tokens?.access_token ?? null);
      if (firstResponse.status !== 401) {
        return firstResponse;
      }

      const refreshed = await refreshTokens();
      if (!refreshed?.access_token) {
        return firstResponse;
      }

      return makeRequest(refreshed.access_token);
    },
    [baseUrl, refreshTokens, tokens?.access_token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: tokens?.access_token ?? null,
      isAuthenticated: Boolean(tokens?.access_token),
      isInitializing,
      loginWithEmail,
      loginWithGoogle,
      logout,
      authFetch,
    }),
    [authFetch, isInitializing, loginWithEmail, loginWithGoogle, logout, tokens?.access_token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
