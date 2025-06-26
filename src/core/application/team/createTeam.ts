import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Team } from "@/core/domain/team/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const createTeamInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  createdById: z.string().uuid(),
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

export async function createTeam(
  context: Context,
  input: CreateTeamInput,
): Promise<Result<Team, ApplicationError>> {
  // Verify that the creator exists
  const creatorResult = await context.userRepository.findById(
    input.createdById,
  );
  if (creatorResult.isErr()) {
    return err(
      new ApplicationError("Failed to find creator", creatorResult.error),
    );
  }

  if (creatorResult.value === null) {
    return err(new ApplicationError("Creator not found"));
  }

  // Create team
  const createResult = await context.teamRepository.create({
    name: input.name,
    description: input.description,
    createdById: input.createdById,
  });

  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create team", createResult.error),
    );
  }

  return ok(createResult.value);
}
