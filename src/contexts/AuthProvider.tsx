// caminho: src/contexts/AuthProvider.tsx

import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  browserLocalPersistence,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  AuthSessionError,
  resolveAuthSession,
} from "../firebase/auth/resolveAuthSession";
import { auth } from "../firebase/firebase";
import {
  AuthContext,
  type AuthContextValue,
  type AuthSession,
} from "./auth-context";

const normalizeEmail = (
  value: string,
): string => {
  return value
    .trim()
    .toLowerCase();
};

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [
    session,
    setSession,
  ] = useState<AuthSession | null>(
    null,
  );

  const [
    initializing,
    setInitializing,
  ] = useState(true);

  /**
   * Evita que uma resolução antiga sobrescreva uma autenticação,
   * logout ou troca de usuário mais recente.
   */
  const authSequence = useRef(0);

  /**
   * O login resolve a sessão diretamente.
   *
   * Enquanto ele acontece, ignoramos o callback intermediário do
   * onAuthStateChanged para não executar duas resoluções concorrentes.
   */
  const authMutationInProgress =
    useRef(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (
          authMutationInProgress.current
        ) {
          return;
        }

        const sequence =
          ++authSequence.current;

        void (async () => {
          try {
            if (!user) {
              if (
                !active ||
                sequence !==
                authSequence.current
              ) {
                return;
              }

              setSession(null);
              return;
            }

            const restoredSession =
              await resolveAuthSession(
                user,
              );

            if (
              !active ||
              sequence !==
              authSequence.current ||
              auth.currentUser?.uid !==
              user.uid
            ) {
              return;
            }

            setSession(
              restoredSession,
            );
          } catch {
            if (
              !active ||
              sequence !==
              authSequence.current
            ) {
              return;
            }

            setSession(null);

            /*
             * Uma autenticação sem workspace válido não pode permanecer
             * aberta. A identidade Firebase é encerrada para evitar que
             * componentes renderizem com uma sessão parcial.
             */
            try {
              await signOut(auth);
            } catch {
              // O estado local já foi invalidado.
            }
          } finally {
            if (
              active &&
              sequence ===
              authSequence.current
            ) {
              setInitializing(false);
            }
          }
        })();
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (
      rawEmail: string,
      password: string,
    ): Promise<void> => {
      const email =
        normalizeEmail(rawEmail);

      if (
        email.length === 0 ||
        password.length === 0
      ) {
        throw new AuthSessionError(
          "AUTH_INVALID_CREDENTIALS",
          "E-mail e senha são obrigatórios.",
        );
      }

      const sequence =
        ++authSequence.current;

      authMutationInProgress.current =
        true;

      try {
        /*
         * A persistência é configurada antes do login.
         * Nenhuma senha ou token é salvo manualmente pelo aplicativo.
         */
        await setPersistence(
          auth,
          browserLocalPersistence,
        );

        const credential =
          await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );

        /*
         * Recarrega o usuário para evitar decidir com um estado antigo
         * de emailVerified.
         */
        await credential.user.reload();

        const authenticatedUser =
          auth.currentUser;

        if (
          !authenticatedUser ||
          authenticatedUser.uid !==
          credential.user.uid
        ) {
          throw new AuthSessionError(
            "AUTH_INVALID_SESSION",
            "A sessão autenticada não pôde ser confirmada.",
          );
        }

        if (
          !authenticatedUser.emailVerified
        ) {
          /*
           * Mesmo comportamento do aplicativo Flutter:
           * tenta reenviar a verificação, mas uma falha no reenvio
           * não altera a decisão de bloquear o acesso.
           */
          try {
            await sendEmailVerification(
              authenticatedUser,
            );
          } catch {
            // Rate limit ou reenvio indisponível não libera a conta.
          }

          throw new AuthSessionError(
            "AUTH_EMAIL_NOT_VERIFIED",
            "O e-mail da conta ainda não foi verificado.",
          );
        }

        const authenticatedSession =
          await resolveAuthSession(
            authenticatedUser,
          );

        if (
          sequence !==
          authSequence.current ||
          auth.currentUser?.uid !==
          authenticatedUser.uid
        ) {
          throw new AuthSessionError(
            "AUTH_INVALID_SESSION",
            "A sessão foi alterada durante o login.",
          );
        }

        setSession(
          authenticatedSession,
        );

        setInitializing(false);
      } catch (error) {
        try {
          await signOut(auth);
        } catch {
          // A sessão local será removida mesmo se o logout remoto falhar.
        }

        setSession(null);
        setInitializing(false);

        throw error;
      } finally {
        authMutationInProgress.current =
          false;
      }
    },
    [],
  );

  const logout = useCallback(
    async (): Promise<void> => {
      ++authSequence.current;

      authMutationInProgress.current =
        true;

      try {
        await signOut(auth);
      } finally {
        setSession(null);
        setInitializing(false);

        authMutationInProgress.current =
          false;
      }
    },
    [],
  );

  const value =
    useMemo<AuthContextValue>(
      () => ({
        initializing,
        session,
        login,
        logout,
      }),
      [
        initializing,
        login,
        logout,
        session,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};
