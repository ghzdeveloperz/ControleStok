export interface PasswordValidation { readonly valid: boolean; readonly issues: readonly string[]; }
export const validatePassword = (value: string): PasswordValidation => {
  const issues: string[] = [];
  if (value.length < 8) issues.push("Use pelo menos 8 caracteres.");
  if (!/[a-z]/u.test(value)) issues.push("Inclua uma letra minúscula.");
  if (!/[A-Z]/u.test(value)) issues.push("Inclua uma letra maiúscula.");
  if (!/\d/u.test(value)) issues.push("Inclua um número.");
  return { valid: issues.length === 0, issues };
};
