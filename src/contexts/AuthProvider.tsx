import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  browserLocalPersistence,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase/firebase";
import {
  AuthContext,
  type AuthContextValue,
  type AuthSession,
} from "./auth-context";

interface LoginRequest {
  login: string;
  password: string;
}

interface LoginResponse {
  token: string;
  workspaceId: string;
  login: string;
  memberRole: string;
}

const loginWithPassword = httpsCallable<LoginRequest, LoginResponse>(
  functions,
  "loginWithPassword",
);

const readSession = async (): Promise<AuthSession | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const token = await getIdTokenResult(currentUser);
  const workspaceId = token.claims.workspaceId;
  const login = token.claims.login;
  const memberRole = token.claims.memberRole;

  if (
    typeof workspaceId !== "string" ||
    typeof login !== "string" ||
    typeof memberRole !== "string"
  ) {
    await signOut(auth);
    return null;
  }

  return { workspaceId, login, memberRole };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async () => {
      try {
        const restoredSession = await readSession();
        if (active) setSession(restoredSession);
      } catch {
        if (active) setSession(null);
      } finally {
        if (active) setInitializing(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (rawLogin: string, password: string) => {
    const normalizedLogin = rawLogin.trim().toLowerCase();
    const response = await loginWithPassword({
      login: normalizedLogin,
      password,
    });

    const { token } = response.data;
    if (typeof token !== "string" || token.length === 0) {
      throw new Error("AUTH_INVALID_RESPONSE");
    }

    await setPersistence(auth, browserLocalPersistence);
    await signInWithCustomToken(auth, token);

    const authenticatedSession = await readSession();
    if (!authenticatedSession) throw new Error("AUTH_INVALID_SESSION");
    setSession(authenticatedSession);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ initializing, session, login, logout }),
    [initializing, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
