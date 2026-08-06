import type { RegistrationStage } from "./RegistrationStage";

export interface RegistrationSession {
  readonly email: string;
  readonly stage: RegistrationStage;
  readonly startedAt: number;
  readonly verificationSentAt: number | null;
}
