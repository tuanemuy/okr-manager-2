import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const changePasswordInputSchema = z.object({
  userId: z.string().uuid(),
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export async function changePassword(
  context: Context,
  input: ChangePasswordInput,
): Promise<Result<void, ApplicationError>> {
  // Find user with auth info to verify current password
  const userResult = await context.userRepository.findById(input.userId);
  if (userResult.isErr()) {
    await context.logger.error("Failed to find user", userResult.error, {
      userId: input.userId,
    });
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  if (userResult.value === null) {
    return err(new ApplicationError("User not found"));
  }

  // Get user with auth info for password verification
  const userWithAuthResult = await context.userRepository.findByEmailForAuth(
    userResult.value.email,
  );
  if (userWithAuthResult.isErr()) {
    await context.logger.error(
      "Failed to get user auth info",
      userWithAuthResult.error,
      { userId: input.userId, email: userResult.value.email },
    );
    return err(
      new ApplicationError(
        "Failed to get user auth info",
        userWithAuthResult.error,
      ),
    );
  }

  if (userWithAuthResult.value === null) {
    return err(new ApplicationError("User not found"));
  }

  const userWithAuth = userWithAuthResult.value;

  // Verify current password
  const verifyResult = await context.passwordHasher.verify(
    input.currentPassword,
    userWithAuth.hashedPassword,
  );
  if (verifyResult.isErr()) {
    await context.logger.error(
      "Failed to verify current password",
      verifyResult.error,
      { userId: input.userId },
    );
    return err(
      new ApplicationError(
        "Failed to verify current password",
        verifyResult.error,
      ),
    );
  }

  if (!verifyResult.value) {
    return err(new ApplicationError("Current password is incorrect"));
  }

  // Hash new password
  const hashResult = await context.passwordHasher.hash(input.newPassword);
  if (hashResult.isErr()) {
    await context.logger.error(
      "Failed to hash new password",
      hashResult.error,
      { userId: input.userId },
    );
    return err(
      new ApplicationError("Failed to hash new password", hashResult.error),
    );
  }

  // Update password
  const updateResult = await context.userRepository.changePassword(
    input.userId,
    hashResult.value,
  );
  if (updateResult.isErr()) {
    await context.logger.error(
      "Failed to change password",
      updateResult.error,
      { userId: input.userId },
    );
    return err(
      new ApplicationError("Failed to change password", updateResult.error),
    );
  }

  return ok(undefined);
}
