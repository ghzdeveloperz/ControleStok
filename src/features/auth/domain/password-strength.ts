export interface PasswordStrengthResult {
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly label: string;
  readonly isAcceptable: boolean;
}

export const evaluatePasswordStrength = (password: string): PasswordStrengthResult => {
  if (!password) {
    return { score: 0, label: "Informe uma senha", isAcceptable: false };
  }

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/u.test(password) && /[A-Z]/u.test(password)) points += 1;
  if (/\d/u.test(password)) points += 1;
  if (/[^A-Za-z0-9]/u.test(password)) points += 1;

  const score = Math.min(4, Math.max(1, points)) as 1 | 2 | 3 | 4;
  const labels = {
    1: "Senha fraca",
    2: "Senha razoável",
    3: "Senha forte",
    4: "Senha muito forte",
  } as const;

  return {
    score,
    label: labels[score],
    isAcceptable: score >= 3 && password.length >= 8,
  };
};
