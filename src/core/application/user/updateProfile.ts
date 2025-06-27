import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const updateProfileInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export async function updateProfile(
  context: Context,
  input: UpdateProfileInput,
): Promise<Result<User, ApplicationError>> {
  // Check if user exists
  const userResult = await context.userRepository.findById(input.id);
  if (userResult.isErr()) {
    await context.logger.error("Failed to find user by id", userResult.error, {
      userId: input.id,
    });
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  if (userResult.value === null) {
    return err(new ApplicationError("User not found"));
  }

  // Update user profile
  const updateResult = await context.userRepository.update({
    id: input.id,
    name: input.name,
    avatarUrl: input.avatarUrl,
  });

  if (updateResult.isErr()) {
    await context.logger.error(
      "Failed to update user profile",
      updateResult.error,
      { userId: input.id },
    );
    return err(
      new ApplicationError("Failed to update profile", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
