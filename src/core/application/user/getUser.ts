import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const getUserInputSchema = z.object({
  id: z.string().uuid(),
});

export type GetUserInput = z.infer<typeof getUserInputSchema>;

export async function getUser(
  context: Context,
  input: GetUserInput,
): Promise<Result<User, ApplicationError>> {
  const userResult = await context.userRepository.findById(input.id);

  if (userResult.isErr()) {
    await context.logger.error("Failed to get user", userResult.error, {
      userId: input.id,
    });
    return err(new ApplicationError("Failed to get user", userResult.error));
  }

  if (userResult.value === null) {
    return err(new ApplicationError("User not found"));
  }

  return ok(userResult.value);
}
