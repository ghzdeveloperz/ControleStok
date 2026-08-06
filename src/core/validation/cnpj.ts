export const cnpjOnlyDigits = (value: string): string => value.replace(/\D/gu, "").slice(0, 14);

export const formatCnpj = (value: string): string => {
  const digits = cnpjOnlyDigits(value);
  return digits
    .replace(/^(\d{2})(\d)/u, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/u, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/u, ".$1/$2")
    .replace(/(\d{4})(\d)/u, "$1-$2");
};

const calculateDigit = (base: string, weights: readonly number[]): number => {
  const sum = base
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

export const isValidCnpj = (value: string): boolean => {
  const digits = cnpjOnlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1{13}$/u.test(digits)) return false;

  const first = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(`${digits.slice(0, 12)}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return digits.endsWith(`${first}${second}`);
};
