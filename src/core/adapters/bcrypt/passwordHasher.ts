import bcrypt from "bcryptjs";
import { err, ok, type Result } from "neverthrow";
import type {
  PasswordHasher,
  PasswordHasherError,
} from "@/core/domain/auth/ports/passwordHasher";
import { PasswordHasherError as PasswordHashError } from "@/core/domain/auth/ports/passwordHasher";

export class BcryptPasswordHasher implements PasswordHasher {
  private readonly saltRounds: number;

  constructor(saltRounds = 12) {
    this.saltRounds = saltRounds;
  }

  async hash(
    plainPassword: string,
  ): Promise<Result<string, PasswordHasherError>> {
    try {
      const hashedPassword = await bcrypt.hash(plainPassword, this.saltRounds);
      return ok(hashedPassword);
    } catch (error) {
      return err(new PasswordHashError("Failed to hash password", error));
    }
  }

  async verify(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<Result<boolean, PasswordHasherError>> {
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      return ok(isValid);
    } catch (error) {
      return err(new PasswordHashError("Failed to verify password", error));
    }
  }
}
