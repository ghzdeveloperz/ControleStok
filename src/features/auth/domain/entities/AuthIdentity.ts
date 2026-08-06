export interface AuthIdentity {
  readonly uid: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly displayName: string | null;
}
