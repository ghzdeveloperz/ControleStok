import { validatePassword } from "../../../../core/validation/passwordValidator";
export class Password {
  readonly value: string;
  constructor(value: string) {
    const result = validatePassword(value);
    if (!result.valid) throw new Error(result.issues[0] ?? "Senha inválida.");
    this.value = value;
  }
}
