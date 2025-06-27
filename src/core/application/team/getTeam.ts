import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Team } from "@/core/domain/team/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const getTeamInputSchema = z.object({
  id: z.string().uuid(),
  requesterId: z.string().uuid(), // User making the request
});

export type GetTeamInput = z.infer<typeof getTeamInputSchema>;

export async function getTeam(
  context: Context,
  input: GetTeamInput,
): Promise<Result<Team, ApplicationError>> {
  // Check if team exists
  const teamResult = await context.teamRepository.findById(input.id);
  if (teamResult.isErr()) {
    await context.logger.error("Failed to find team", teamResult.error, {
      teamId: input.id,
    });
    return err(new ApplicationError("Failed to find team", teamResult.error));
  }

  if (teamResult.value === null) {
    return err(new ApplicationError("Team not found"));
  }

  const team = teamResult.value;

  // Check if requester has access to this team (must be a member or creator)
  if (team.createdById !== input.requesterId) {
    const memberResult = await context.teamRepository.findMember(
      input.id,
      input.requesterId,
    );
    if (memberResult.isErr()) {
      await context.logger.error(
        "Failed to check team membership",
        memberResult.error,
        { teamId: input.id, requesterId: input.requesterId },
      );
      return err(
        new ApplicationError(
          "Failed to check team membership",
          memberResult.error,
        ),
      );
    }

    if (memberResult.value === null) {
      return err(new ApplicationError("Access denied - not a team member"));
    }
  }

  return ok(team);
}
