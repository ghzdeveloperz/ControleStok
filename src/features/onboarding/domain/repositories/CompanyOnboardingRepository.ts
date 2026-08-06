import type { CompanyRegistration } from "../entities/CompanyRegistration";
export interface CompanyOnboardingRepository { complete(input: CompanyRegistration): Promise<void>; }
