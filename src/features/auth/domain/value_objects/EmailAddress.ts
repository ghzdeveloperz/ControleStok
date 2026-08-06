import { normalizeEmail } from "../../../../core/security/normalizeEmail";
import { isValidEmail } from "../../../../core/validation/emailValidator";
export class EmailAddress {
  readonly value: string;
  constructor(raw: string) {
    const value = normalizeEmail(raw);
    if (!isValidEmail(value)) throw new Error("E-mail inválido.");
    this.value = value;
  }
}
