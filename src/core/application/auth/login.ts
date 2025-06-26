import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod/v4";
import type { Session } from "@/core/domain/auth/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import { ApplicationError } from "./register";

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export async function login(
  context: Context,
  input: LoginInput,
): Promise<Result<{ user: User; session: Session }, ApplicationError>> {
  // Find user by email (with auth info)
  const userResult = await context.userRepository.findByEmailForAuth(
    input.email,
  );
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  if (userResult.value === null) {
    return err(new ApplicationError("Invalid email or password"));
  }

  const userWithAuth = userResult.value;

  // Verify password
  const verifyResult = await context.passwordHasher.verify(
    input.password,
    userWithAuth.hashedPassword,
  );
  if (verifyResult.isErr()) {
    return err(
      new ApplicationError("Failed to verify password", verifyResult.error),
    );
  }

  if (!verifyResult.value) {
    return err(new ApplicationError("Invalid email or password"));
  }

  // Create session
  const sessionResult = await context.sessionRepository.create({
    userId: userWithAuth.id,
    token: uuidv7(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  if (sessionResult.isErr()) {
    return err(
      new ApplicationError("Failed to create session", sessionResult.error),
    );
  }

  // Convert UserWithAuth to User (remove sensitive info)
  const user: User = {
    id: userWithAuth.id,
    email: userWithAuth.email,
    name: userWithAuth.name,
    avatarUrl: userWithAuth.avatarUrl,
    emailVerified: userWithAuth.emailVerified,
    createdAt: userWithAuth.createdAt,
    updatedAt: userWithAuth.updatedAt,
  };

  return ok({
    user,
    session: sessionResult.value,
  });
}
