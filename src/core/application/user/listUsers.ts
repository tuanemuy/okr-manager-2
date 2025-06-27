import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { UserProfile } from "@/core/domain/user/types";
import { paginationSchema } from "@/lib/pagination";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const listUsersInputSchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      search: z.string().optional(),
      emailVerified: z.boolean().optional(),
    })
    .optional(),
});

export type ListUsersInput = z.infer<typeof listUsersInputSchema>;

export async function listUsers(
  context: Context,
  input: ListUsersInput,
): Promise<Result<{ items: UserProfile[]; count: number }, ApplicationError>> {
  const listResult = await context.userRepository.list(input);

  if (listResult.isErr()) {
    await context.logger.error("Failed to list users", listResult.error, {
      filter: input.filter,
      pagination: input.pagination,
    });
    return err(new ApplicationError("Failed to list users", listResult.error));
  }

  return ok(listResult.value);
}
