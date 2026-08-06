export type AccountType = "merchant" | "supplier";

export interface CompleteCompanyRegistrationInput {
  readonly accountType: AccountType;
  readonly company: string;
  readonly document: string;
  readonly fantasyName?: string;
  readonly owner?: string;
  readonly phone?: string;
  readonly businessType: string;
  readonly acceptedTerms: boolean;
  readonly acceptedPrivacy: boolean;
}

export interface CompleteCompanyRegistrationResult {
  readonly accountType: AccountType;
  readonly onboardingCompleted: boolean;
}
