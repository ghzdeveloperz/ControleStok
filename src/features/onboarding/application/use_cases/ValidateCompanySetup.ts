import { isValidCnpj } from "../../../../core/validation/cnpj";
import type { CompanyRegistration } from "../../domain/entities/CompanyRegistration";
export const validateCompanySetup = (input: CompanyRegistration): readonly string[] => {
  const errors: string[] = [];
  if (!input.legalName.trim()) errors.push("Informe a razão social ou nome da empresa.");
  if (!isValidCnpj(input.cnpj)) errors.push("Informe um CNPJ válido.");
  if (!input.businessType.trim()) errors.push("Selecione o tipo de negócio.");
  if (!input.termsAccepted || !input.privacyAccepted) errors.push("Aceite os termos e a política de privacidade.");
  return errors;
};
