// caminho: src/contexts/auth-context.ts

import { createContext } from "react";

export type AuthMemberRole =
  | "owner"
  | "admin"
  | "manager"
  | "operator"
  | "viewer";

export interface AuthSession {
  /**
   * UID real autenticado pelo Firebase Authentication.
   *
   * Nunca substitua este valor por IDs vindos de formulário,
   * localStorage, query string ou payload do cliente.
   */
  userId: string;

  /**
   * UID do proprietário do estoque atualmente aberto.
   *
   * Nesta primeira fase Web, somente o estoque próprio é liberado.
   */
  workspaceId: string;

  workspaceName: string;
  login: string;
  memberRole: AuthMemberRole;
  isOwnWorkspace: boolean;
}

export interface AuthContextValue {
  initializing: boolean;
  session: AuthSession | null;

  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  logout: () => Promise<void>;
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );
