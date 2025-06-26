import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";

export class PasswordHasherError extends AnyError {
  override readonly name = "PasswordHasherError";
}

export interface PasswordHasher {
  hash(plainPassword: string): Promise<Result<string, PasswordHasherError>>;

  verify(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<Result<boolean, PasswordHasherError>>;
}
