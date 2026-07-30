import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  browserLocalPersistence,
  getIdTokenResult,
  onAuthStateChanged,
  setPersistence,
  signInWithCustomToken,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
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
  { limitedUseAppCheckTokens: true },
);

const VALID_ROLES = new Set(["owner", "admin", "manager", "member", "viewer"]);

const readSession = async (user: User | null): Promise<AuthSession | null> => {
  if (!user) return null;

  const token = await getIdTokenResult(user);
  if (token.signInProvider !== "custom") return null;

  const workspaceId = token.claims.workspaceId;
  const login = token.claims.login;
  const memberRole = token.claims.memberRole;
  const credentialId = token.claims.credentialId;

  if (
    typeof workspaceId !== "string" ||
    typeof login !== "string" ||
    typeof memberRole !== "string" ||
    typeof credentialId !== "string" ||
    !/^[a-f0-9]{64}$/u.test(credentialId) ||
    !VALID_ROLES.has(memberRole)
  ) {
    return null;
  }

  return { workspaceId, login, memberRole };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initializing, setInitializing] = useState(true);
  const authSequence = useRef(0);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const sequence = ++authSequence.current;

      try {
        const restoredSession = await readSession(user);
        if (!active || sequence !== authSequence.current) return;

        if (user && !restoredSession) {
          await signOut(auth);
          return;
        }

        setSession(restoredSession);
      } catch {
        if (active && sequence === authSequence.current) setSession(null);
      } finally {
        if (active && sequence === authSequence.current) setInitializing(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (rawLogin: string, password: string) => {
    ++authSequence.current;
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
    const credential = await signInWithCustomToken(auth, token);

    const authenticatedSession = await readSession(credential.user);
    if (
      !authenticatedSession ||
      auth.currentUser?.uid !== credential.user.uid
    ) {
      await signOut(auth);
      throw new Error("AUTH_INVALID_SESSION");
    }

    setSession(authenticatedSession);
    setInitializing(false);
  }, []);

  const logout = useCallback(async () => {
    ++authSequence.current;
    await signOut(auth);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ initializing, session, login, logout }),
    [initializing, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
