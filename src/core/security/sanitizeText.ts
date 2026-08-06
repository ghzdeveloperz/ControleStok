export const sanitizeText = (value: string, maxLength: number): string =>
  value.replace(/[\u0000-\u001F\u007F]/gu, " ").replace(/\s+/gu, " ").trim().slice(0, maxLength);
