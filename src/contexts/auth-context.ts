import { createContext } from "react";

export interface AuthSession {
  workspaceId: string;
  login: string;
  memberRole: string;
}

export interface AuthContextValue {
  initializing: boolean;
  session: AuthSession | null;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
