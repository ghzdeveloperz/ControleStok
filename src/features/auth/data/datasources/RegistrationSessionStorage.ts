import type { RegistrationSession } from "../../domain/entities/RegistrationSession";
const key = "mystoreday.registration.session.v1";
export class RegistrationSessionStorage {
  read(): RegistrationSession | null {
    try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) as RegistrationSession : null; } catch { return null; }
  }
  write(value: RegistrationSession): void { sessionStorage.setItem(key, JSON.stringify(value)); }
  clear(): void { sessionStorage.removeItem(key); }
}
