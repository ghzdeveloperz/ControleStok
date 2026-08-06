import { normalizeEmail } from "../security/normalizeEmail";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
export const isValidEmail = (value: string): boolean => {
  const email = normalizeEmail(value);
  return email.length <= 254 && emailPattern.test(email);
};
