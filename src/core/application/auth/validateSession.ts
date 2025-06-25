import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Session } from "@/core/domain/auth/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import { ApplicationError } from "./register";

export const validateSessionInputSchema = z.object({
  token: z.string(),
});

export type ValidateSessionInput = z.infer<typeof validateSessionInputSchema>;

export async function validateSession(
  context: Context,
  input: ValidateSessionInput,
): Promise<Result<{ user: User; session: Session }, ApplicationError>> {
  // Find session
  const sessionResult = await context.sessionRepository.findByToken(
    input.token,
  );
  if (sessionResult.isErr()) {
    return err(
      new ApplicationError("Failed to find session", sessionResult.error),
    );
  }

  if (sessionResult.value === null) {
    return err(new ApplicationError("Invalid session"));
  }

  const session = sessionResult.value;

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    // Delete expired session
    await context.sessionRepository.delete(session.id);
    return err(new ApplicationError("Session expired"));
  }

  // Find user
  const userResult = await context.userRepository.findById(session.userId);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  if (userResult.value === null) {
    // Delete session for non-existent user
    await context.sessionRepository.delete(session.id);
    return err(new ApplicationError("User not found"));
  }

  return ok({
    user: userResult.value,
    session,
  });
}
