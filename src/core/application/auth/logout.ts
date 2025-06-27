import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Context } from "../context";
import { ApplicationError } from "./register";

export const logoutInputSchema = z.object({
  token: z.string(),
});

export type LogoutInput = z.infer<typeof logoutInputSchema>;

export async function logout(
  context: Context,
  input: LogoutInput,
): Promise<Result<void, ApplicationError>> {
  const deleteResult = await context.sessionRepository.deleteByToken(
    input.token,
  );

  if (deleteResult.isErr()) {
    await context.logger.error("Failed to delete session", deleteResult.error, {
      token: input.token,
    });
    return err(
      new ApplicationError("Failed to delete session", deleteResult.error),
    );
  }

  return ok(undefined);
}
