import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const deleteUserInputSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

export async function deleteUser(
  context: Context,
  input: DeleteUserInput,
): Promise<Result<void, ApplicationError>> {
  // Check if user exists
  const userResult = await context.userRepository.findById(input.id);
  if (userResult.isErr()) {
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  if (userResult.value === null) {
    return err(new ApplicationError("User not found"));
  }

  // Delete all user sessions first
  const deleteSessionsResult = await context.sessionRepository.deleteByUserId(
    input.id,
  );
  if (deleteSessionsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to delete user sessions",
        deleteSessionsResult.error,
      ),
    );
  }

  // Delete user
  const deleteResult = await context.userRepository.delete(input.id);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete user", deleteResult.error),
    );
  }

  return ok(undefined);
}
