export type AccountType = "merchant" | "supplier";
export interface CompanyRegistration {
  readonly accountType: AccountType;
  readonly legalName: string;
  readonly cnpj: string;
  readonly businessType: string;
  readonly fantasyName?: string;
  readonly responsibleName?: string;
  readonly phone?: string;
  readonly termsAccepted: boolean;
  readonly privacyAccepted: boolean;
}
