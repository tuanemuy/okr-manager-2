import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { TeamWithStats } from "@/core/domain/team/types";
import { paginationSchema } from "@/lib/pagination";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const listTeamsInputSchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      search: z.string().optional(),
      ownerId: z.string().uuid().optional(),
      memberId: z.string().uuid().optional(),
    })
    .optional(),
});

export type ListTeamsInput = z.infer<typeof listTeamsInputSchema>;

export async function listTeams(
  context: Context,
  input: ListTeamsInput,
): Promise<
  Result<{ items: TeamWithStats[]; count: number }, ApplicationError>
> {
  const listResult = await context.teamRepository.list(input);

  if (listResult.isErr()) {
    await context.logger.error("Failed to list teams", listResult.error, {
      filter: input.filter,
      pagination: input.pagination,
    });
    return err(new ApplicationError("Failed to list teams", listResult.error));
  }

  return ok(listResult.value);
}
