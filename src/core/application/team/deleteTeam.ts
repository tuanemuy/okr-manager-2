import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const deleteTeamInputSchema = z.object({
  id: z.string().uuid(),
  requesterId: z.string().uuid(), // User making the request
});

export type DeleteTeamInput = z.infer<typeof deleteTeamInputSchema>;

export async function deleteTeam(
  context: Context,
  input: DeleteTeamInput,
): Promise<Result<void, ApplicationError>> {
  // Check if team exists
  const teamResult = await context.teamRepository.findById(input.id);
  if (teamResult.isErr()) {
    return err(new ApplicationError("Failed to find team", teamResult.error));
  }

  if (teamResult.value === null) {
    return err(new ApplicationError("Team not found"));
  }

  const team = teamResult.value;

  // Only team creator can delete team
  if (team.createdById !== input.requesterId) {
    return err(new ApplicationError("Only team creator can delete team"));
  }

  // Delete team (this should cascade delete members, invitations, etc.)
  const deleteResult = await context.teamRepository.delete(input.id);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete team", deleteResult.error),
    );
  }

  return ok(undefined);
}
