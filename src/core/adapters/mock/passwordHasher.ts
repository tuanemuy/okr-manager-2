import { ok, type Result } from "neverthrow";
import type {
  PasswordHasher,
  PasswordHasherError,
} from "@/core/domain/auth/ports/passwordHasher";

export class MockPasswordHasher implements PasswordHasher {
  private readonly isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  async hash(
    plainPassword: string,
  ): Promise<Result<string, PasswordHasherError>> {
    if (this.isDevelopment) {
      console.log(
        `🔐 [MOCK PASSWORD HASHER] Hashing password: ${plainPassword}`,
      );
    }

    // Simple mock hashing - just prefix with "mock_hash_"
    // In real implementation, this would use bcrypt or similar
    const hashedPassword = `mock_hash_${plainPassword}`;

    return ok(hashedPassword);
  }

  async verify(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<Result<boolean, PasswordHasherError>> {
    if (this.isDevelopment) {
      console.log(
        `🔍 [MOCK PASSWORD HASHER] Verifying password: ${plainPassword} against hash: ${hashedPassword}`,
      );
    }

    // Simple mock verification - check if hash matches our mock pattern
    const expectedHash = `mock_hash_${plainPassword}`;
    const isValid = hashedPassword === expectedHash;

    return ok(isValid);
  }

  // Helper method for testing - allows direct comparison without going through hash/verify cycle
  static createMockHash(plainPassword: string): string {
    return `mock_hash_${plainPassword}`;
  }

  // Helper method for testing - check if a hash was created by this mock
  static isMockHash(hash: string): boolean {
    return hash.startsWith("mock_hash_");
  }
}
