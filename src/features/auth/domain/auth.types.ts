import type { User } from "firebase/auth";

export type AuthMemberRole = "owner" | "admin" | "manager" | "operator" | "viewer";

export interface AuthSession {
  readonly userId: string;
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly login: string;
  readonly memberRole: AuthMemberRole;
  readonly isOwnWorkspace: boolean;
}

export type AuthStatus =
  | "initializing"
  | "unauthenticated"
  | "email_verification_required"
  | "company_setup_required"
  | "authenticated"
  | "unsupported_account"
  | "error";

export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
}

export interface AuthContextValue {
  readonly initializing: boolean;
  readonly status: AuthStatus;
  readonly user: User | null;
  readonly session: AuthSession | null;
  readonly statusMessage: string | null;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly register: (input: RegisterInput) => Promise<void>;
  readonly loginWithGoogle: () => Promise<void>;
  readonly resendVerification: () => Promise<void>;
  readonly refreshVerification: () => Promise<void>;
  readonly resetPassword: (email: string) => Promise<void>;
  readonly refreshAccount: () => Promise<void>;
  readonly logout: () => Promise<void>;
}
