import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import {
  AuthSessionError,
  resolveAuthSession,
} from "../../../firebase/auth/resolveAuthSession";
import {
  registerWithEmail,
  sendResetEmail,
  sendVerificationEmail,
  signInWithEmail,
  signInWithGoogle,
} from "../data/firebase-auth.repository";
import type {
  AuthContextValue,
  AuthSession,
  AuthStatus,
  RegisterInput,
} from "../domain/auth.types";
import { AuthContext } from "./auth-context";

interface ResolvedState {
  readonly status: AuthStatus;
  readonly session: AuthSession | null;
  readonly message: string | null;
}

const stateFromSessionError = (error: AuthSessionError): ResolvedState | null => {
  switch (error.code) {
    case "AUTH_EMAIL_NOT_VERIFIED":
      return {
        status: "email_verification_required",
        session: null,
        message: null,
      };
    case "AUTH_ACCOUNT_NOT_CONFIGURED":
    case "AUTH_NO_ACTIVE_WORKSPACE":
      return {
        status: "company_setup_required",
        session: null,
        message: null,
      };
    case "AUTH_UNSUPPORTED_ACCOUNT":
    case "AUTH_SHARED_WORKSPACE_UNSUPPORTED":
      return {
        status: "unsupported_account",
        session: null,
        message: error.message,
      };
    case "AUTH_SESSION_UNAVAILABLE":
      return {
        status: "error",
        session: null,
        message: error.message,
      };
    case "AUTH_ACCOUNT_INACTIVE":
    case "AUTH_INVALID_CREDENTIALS":
    case "AUTH_INVALID_SESSION":
      return null;
  }
};

export const AuthProvider = ({ children }: { readonly children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const sequenceRef = useRef(0);
  const mutationInProgressRef = useRef(false);

  const applyState = useCallback((resolved: ResolvedState) => {
    setStatus(resolved.status);
    setSession(resolved.session);
    setStatusMessage(resolved.message);
  }, []);

  const resolveUser = useCallback(
    async (candidate: User, sequence: number): Promise<AuthStatus> => {
      await candidate.reload();
      const freshUser = auth.currentUser;

      if (!freshUser || freshUser.uid !== candidate.uid) {
        throw new AuthSessionError(
          "AUTH_INVALID_SESSION",
          "A sessão autenticada não pôde ser confirmada.",
        );
      }

      if (sequence !== sequenceRef.current) return "initializing";

      setUser(freshUser);

      if (!freshUser.emailVerified) {
        applyState({
          status: "email_verification_required",
          session: null,
          message: null,
        });
        return "email_verification_required";
      }

      try {
        const resolvedSession = await resolveAuthSession(freshUser);
        if (sequence !== sequenceRef.current || auth.currentUser?.uid !== freshUser.uid) {
          return "initializing";
        }

        applyState({
          status: "authenticated",
          session: resolvedSession,
          message: null,
        });
        return "authenticated";
      } catch (error) {
        if (!(error instanceof AuthSessionError)) throw error;

        const mappedState = stateFromSessionError(error);
        if (mappedState) {
          applyState(mappedState);
          return mappedState.status;
        }

        throw error;
      }
    },
    [applyState],
  );

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (mutationInProgressRef.current) return;

      const sequence = ++sequenceRef.current;

      void (async () => {
        try {
          if (!nextUser) {
            if (!active || sequence !== sequenceRef.current) return;
            setUser(null);
            applyState({ status: "unauthenticated", session: null, message: null });
            return;
          }

          await resolveUser(nextUser, sequence);
        } catch (error) {
          if (!active || sequence !== sequenceRef.current) return;

          setUser(null);
          applyState({
            status: "error",
            session: null,
            message:
              error instanceof Error
                ? error.message
                : "Não foi possível validar sua conta agora.",
          });

          try {
            await signOut(auth);
          } catch {
            // O estado local já foi invalidado.
          }
        }
      })();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [applyState, resolveUser]);

  const runAuthMutation = useCallback(
    async (operation: () => Promise<User>): Promise<AuthStatus> => {
      const sequence = ++sequenceRef.current;
      mutationInProgressRef.current = true;

      try {
        const authenticatedUser = await operation();
        return await resolveUser(authenticatedUser, sequence);
      } catch (error) {
        try {
          await signOut(auth);
        } catch {
          // O estado local será invalidado mesmo se o logout remoto falhar.
        }

        setUser(null);
        applyState({ status: "unauthenticated", session: null, message: null });
        throw error;
      } finally {
        mutationInProgressRef.current = false;
      }
    },
    [resolveUser],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      if (!email.trim() || !password) {
        throw new AuthSessionError(
          "AUTH_INVALID_CREDENTIALS",
          "E-mail e senha são obrigatórios.",
        );
      }

      await runAuthMutation(async () => {
        const credential = await signInWithEmail(email, password);
        return credential.user;
      });
    },
    [runAuthMutation],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<void> => {
      await runAuthMutation(async () => {
        const credential = await registerWithEmail(input);
        return credential.user;
      });
    },
    [runAuthMutation],
  );

  const loginWithGoogleAction = useCallback(async (): Promise<AuthStatus> => {
    return runAuthMutation(async () => {
      const credential = await signInWithGoogle();
      return credential.user;
    });
  }, [runAuthMutation]);

  const resendVerification = useCallback(async (): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new AuthSessionError("AUTH_INVALID_SESSION", "Entre novamente para continuar.");
    }
    await sendVerificationEmail(currentUser);
  }, []);

  const refreshVerification = useCallback(async (): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      applyState({ status: "unauthenticated", session: null, message: null });
      return;
    }

    const sequence = ++sequenceRef.current;
    await resolveUser(currentUser, sequence);
  }, [applyState, resolveUser]);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    if (!email.trim()) {
      throw new Error("Informe seu e-mail para recuperar a senha.");
    }
    await sendResetEmail(email);
  }, []);

  const refreshAccount = useCallback(async (): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      applyState({ status: "unauthenticated", session: null, message: null });
      return;
    }

    const sequence = ++sequenceRef.current;
    await resolveUser(currentUser, sequence);
  }, [applyState, resolveUser]);

  const logout = useCallback(async (): Promise<void> => {
    ++sequenceRef.current;
    mutationInProgressRef.current = true;

    try {
      await signOut(auth);
    } finally {
      setUser(null);
      applyState({ status: "unauthenticated", session: null, message: null });
      mutationInProgressRef.current = false;
    }
  }, [applyState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing: status === "initializing",
      status,
      user,
      session,
      statusMessage,
      login,
      register,
      loginWithGoogle: loginWithGoogleAction,
      resendVerification,
      refreshVerification,
      resetPassword,
      refreshAccount,
      logout,
    }),
    [
      status,
      user,
      session,
      statusMessage,
      login,
      register,
      loginWithGoogleAction,
      resendVerification,
      refreshVerification,
      resetPassword,
      refreshAccount,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

