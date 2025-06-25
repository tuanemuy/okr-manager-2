import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Team } from "@/core/domain/team/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const updateTeamInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  requesterId: z.string().uuid(), // User making the request
});

export type UpdateTeamInput = z.infer<typeof updateTeamInputSchema>;

export async function updateTeam(
  context: Context,
  input: UpdateTeamInput,
): Promise<Result<Team, ApplicationError>> {
  // Check if team exists
  const teamResult = await context.teamRepository.findById(input.id);
  if (teamResult.isErr()) {
    return err(new ApplicationError("Failed to find team", teamResult.error));
  }

  if (teamResult.value === null) {
    return err(new ApplicationError("Team not found"));
  }

  const team = teamResult.value;

  // Check if requester has permission to update team (must be creator or admin)
  const memberResult = await context.teamRepository.findMember(
    input.id,
    input.requesterId,
  );
  if (memberResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check team membership",
        memberResult.error,
      ),
    );
  }

  if (memberResult.value === null && team.createdById !== input.requesterId) {
    return err(new ApplicationError("Not a team member"));
  }

  // Team creator can always update, otherwise check if user is admin
  if (team.createdById !== input.requesterId) {
    if (memberResult.value === null) {
      return err(new ApplicationError("Not a team member"));
    }

    // TODO: Check if member has admin role (need to check role permissions)
    // For now, only allow team creator to update
    return err(new ApplicationError("Insufficient permissions to update team"));
  }

  // Update team
  const updateResult = await context.teamRepository.update({
    id: input.id,
    name: input.name,
    description: input.description,
  });

  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update team", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
