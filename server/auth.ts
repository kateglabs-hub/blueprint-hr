import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, encodedHash: string | null | undefined): boolean {
  if (!encodedHash) return false;

  const [salt, storedHex] = encodedHash.split(":");
  if (!salt || !storedHex || storedHex.length % 2 !== 0) return false;

  try {
    const storedKey = Buffer.from(storedHex, "hex");
    const derivedKey = scryptSync(password, salt, storedKey.length);
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  } catch {
    return false;
  }
}

export function localOpenIdForEmail(email: string): string {
  const digest = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return `local:${digest.slice(0, 58)}`;
}

export const DEFAULT_ADMIN_EMAIL = "admin@blueprinthr.co.ke";
export const DEFAULT_ADMIN_PASSWORD = "BluePrint!2026";
