export type AuthFailureCode =
  | "invalid_email"
  | "weak_password"
  | "email_in_use"
  | "network"
  | "rate_limited"
  | "unknown";

export class AuthFailure extends Error {
  readonly code: AuthFailureCode;

  constructor(
    code: AuthFailureCode,
    message: string,
  ) {
    super(message);

    this.name = "AuthFailure";
    this.code = code;

    Object.setPrototypeOf(
      this,
      AuthFailure.prototype,
    );
  }
}
