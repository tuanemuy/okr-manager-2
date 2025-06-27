import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const verifyEmailInputSchema = z.object({
  token: z.string(),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

export async function verifyEmail(
  context: Context,
  input: VerifyEmailInput,
): Promise<Result<User, ApplicationError>> {
  // Find user by verification token
  const userResult = await context.userRepository.findByEmailVerificationToken(
    input.token,
  );
  if (userResult.isErr()) {
    await context.logger.error(
      "Failed to find user by token",
      userResult.error,
      { token: input.token },
    );
    return err(
      new ApplicationError("Failed to find user by token", userResult.error),
    );
  }

  if (userResult.value === null) {
    return err(new ApplicationError("Invalid verification token"));
  }

  const user = userResult.value;

  // Set email as verified and clear verification token
  const setVerifiedResult = await context.userRepository.setEmailVerified(
    user.id,
    true,
  );
  if (setVerifiedResult.isErr()) {
    await context.logger.error(
      "Failed to verify email",
      setVerifiedResult.error,
      { userId: user.id },
    );
    return err(
      new ApplicationError("Failed to verify email", setVerifiedResult.error),
    );
  }

  const clearTokenResult =
    await context.userRepository.setEmailVerificationToken(user.id, null);
  if (clearTokenResult.isErr()) {
    await context.logger.error(
      "Failed to clear verification token",
      clearTokenResult.error,
      { userId: user.id },
    );
    return err(
      new ApplicationError(
        "Failed to clear verification token",
        clearTokenResult.error,
      ),
    );
  }

  // Return updated user
  const updatedUserResult = await context.userRepository.findById(user.id);
  if (updatedUserResult.isErr()) {
    await context.logger.error(
      "Failed to get updated user",
      updatedUserResult.error,
      { userId: user.id },
    );
    return err(
      new ApplicationError(
        "Failed to get updated user",
        updatedUserResult.error,
      ),
    );
  }

  if (updatedUserResult.value === null) {
    return err(new ApplicationError("User not found after verification"));
  }

  return ok(updatedUserResult.value);
}
