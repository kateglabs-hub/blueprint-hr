import { describe, expect, it } from "vitest";
import { DEFAULT_ADMIN_EMAIL, hashPassword, localOpenIdForEmail, verifyPassword } from "./auth";

describe("local password authentication", () => {
  it("hashes and verifies the correct password without storing plaintext", () => {
    const password = "StrongPassword!2026";
    const encoded = hashPassword(password);

    expect(encoded).not.toContain(password);
    expect(verifyPassword(password, encoded)).toBe(true);
    expect(verifyPassword("wrong-password", encoded)).toBe(false);
  });

  it("creates a stable, bounded local openId from an email address", () => {
    const first = localOpenIdForEmail(DEFAULT_ADMIN_EMAIL);
    const second = localOpenIdForEmail("  ADMIN@BLUEPRINTHR.CO.KE ");

    expect(first).toBe(second);
    expect(first).toMatch(/^local:[a-f0-9]{58}$/);
  });
});
