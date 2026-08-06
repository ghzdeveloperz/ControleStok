import type { RegistrationSession } from "../domain/entities/RegistrationSession";

const STORAGE_KEY = "mystoreday.pending-email-registration.v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const readRegistrationSession = (): RegistrationSession | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;

    const email = typeof parsed.email === "string" ? parsed.email.trim().toLowerCase() : "";
    const stage = parsed.stage;
    const startedAt = typeof parsed.startedAt === "number" ? parsed.startedAt : 0;
    const verificationSentAt =
      typeof parsed.verificationSentAt === "number" ? parsed.verificationSentAt : null;

    if (!email || !["email_entry", "verification_pending", "password_setup"].includes(String(stage))) {
      return null;
    }

    return {
      email,
      stage: stage as RegistrationSession["stage"],
      startedAt,
      verificationSentAt,
    };
  } catch {
    return null;
  }
};

export const writeRegistrationSession = (session: RegistrationSession): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearRegistrationSession = (): void => {
  window.localStorage.removeItem(STORAGE_KEY);
};

export const hasPendingPasswordSetup = (): boolean =>
  readRegistrationSession()?.stage === "password_setup";
