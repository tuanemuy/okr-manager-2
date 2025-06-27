import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";
import { ApplicationError } from "./register";

export const requestPasswordResetInputSchema = z.object({
  email: z.string().email(),
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetInputSchema
>;

export async function requestPasswordReset(
  context: Context,
  input: RequestPasswordResetInput,
): Promise<Result<void, ApplicationError>> {
  // Find user by email
  const userResult = await context.userRepository.findByEmail(input.email);
  if (userResult.isErr()) {
    await context.logger.error("Failed to find user", userResult.error, {
      email: input.email,
    });
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  if (userResult.value === null) {
    // Don't reveal if user exists or not for security
    return ok(undefined);
  }

  const user = userResult.value;

  // Generate reset token (placeholder - should be implemented properly with crypto)
  const resetToken = `reset_${user.id}_${Date.now()}`;
  const resetUrl = `${context.publicUrl}/reset-password?token=${resetToken}`;

  // Send password reset email
  const emailResult = await context.emailService.sendPasswordReset(user.email, {
    userName: user.name,
    resetUrl,
  });

  if (emailResult.isErr()) {
    await context.logger.error(
      "Failed to send password reset email",
      emailResult.error,
      { email: input.email, userId: user.id },
    );
    return err(
      new ApplicationError(
        "Failed to send password reset email",
        emailResult.error,
      ),
    );
  }

  // TODO: Store reset token in database with expiration

  return ok(undefined);
}
