import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const removeTeamMemberInputSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  requesterId: z.string().uuid(), // User making the request
});

export type RemoveTeamMemberInput = z.infer<typeof removeTeamMemberInputSchema>;

export async function removeTeamMember(
  context: Context,
  input: RemoveTeamMemberInput,
): Promise<Result<void, ApplicationError>> {
  // Check if team exists
  const teamResult = await context.teamRepository.findById(input.teamId);
  if (teamResult.isErr()) {
    await context.logger.error("Failed to find team", teamResult.error, {
      teamId: input.teamId,
    });
    return err(new ApplicationError("Failed to find team", teamResult.error));
  }

  if (teamResult.value === null) {
    return err(new ApplicationError("Team not found"));
  }

  const team = teamResult.value;

  // Cannot remove team creator
  if (team.createdById === input.userId) {
    return err(new ApplicationError("Cannot remove team creator"));
  }

  // Check if member to be removed exists
  const memberResult = await context.teamRepository.findMember(
    input.teamId,
    input.userId,
  );
  if (memberResult.isErr()) {
    await context.logger.error(
      "Failed to find team member",
      memberResult.error,
      { teamId: input.teamId, userId: input.userId },
    );
    return err(
      new ApplicationError("Failed to find team member", memberResult.error),
    );
  }

  if (memberResult.value === null) {
    return err(new ApplicationError("User is not a team member"));
  }

  // Check permissions:
  // 1. Team creator can remove anyone
  // 2. Member can only remove themselves
  // TODO: Add role-based permissions when role system is implemented
  if (input.requesterId === input.userId) {
    // Self-removal is always allowed (except for creator)
  } else if (team.createdById === input.requesterId) {
    // Creator can remove anyone
  } else {
    return err(
      new ApplicationError("Insufficient permissions to remove members"),
    );
  }

  // Remove team member (need member ID, not team+user IDs)
  const member = memberResult.value;
  const removeResult = await context.teamRepository.removeMember(member.id);
  if (removeResult.isErr()) {
    await context.logger.error(
      "Failed to remove team member",
      removeResult.error,
      { teamId: input.teamId, userId: input.userId, memberId: member.id },
    );
    return err(
      new ApplicationError("Failed to remove team member", removeResult.error),
    );
  }

  return ok(undefined);
}
