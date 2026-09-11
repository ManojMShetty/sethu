// Who is using the app right now.
//
// Saved in localStorage so a reload does not ask for the OTP again.
// There is no SMS gateway in this build, so the OTP is shown on the
// login screen itself, and 123456 always works for demos.

export type Role = "resident" | "official";

export interface Session {
  phone: string; // 10 digits, no country code
  role: Role;
  signedInAt: number;
}

const KEY = "sethu.session";

export const MASTER_OTP = "123456";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    const roleOk = s.role === "resident" || s.role === "official";
    if (roleOk && /^\d{10}$/.test(s.phone)) return s;
  } catch {
    // storage off or the value was junk; either way, sign in again
  }
  return null;
}

export function saveSession(s: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage off; the session lasts until the tab closes
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

export function makeOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

// 9876543210 -> 98765 43210
export function prettyPhone(phone: string): string {
  return phone.slice(0, 5) + " " + phone.slice(5);
}
