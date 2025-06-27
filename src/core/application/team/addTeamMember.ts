import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { TeamMember } from "@/core/domain/team/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const addTeamMemberInputSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  requesterId: z.string().uuid(), // User making the request
});

export type AddTeamMemberInput = z.infer<typeof addTeamMemberInputSchema>;

export async function addTeamMember(
  context: Context,
  input: AddTeamMemberInput,
): Promise<Result<TeamMember, ApplicationError>> {
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

  // Check if requester has permission to add members (must be creator or admin)
  if (team.createdById !== input.requesterId) {
    const requesterMemberResult = await context.teamRepository.findMember(
      input.teamId,
      input.requesterId,
    );
    if (requesterMemberResult.isErr()) {
      await context.logger.error(
        "Failed to check requester membership",
        requesterMemberResult.error,
        { teamId: input.teamId, requesterId: input.requesterId },
      );
      return err(
        new ApplicationError(
          "Failed to check requester membership",
          requesterMemberResult.error,
        ),
      );
    }

    if (requesterMemberResult.value === null) {
      return err(new ApplicationError("Access denied - not a team member"));
    }

    // TODO: Check if requester has admin role (need to check role permissions)
    // For now, only allow team creator to add members
    return err(new ApplicationError("Insufficient permissions to add members"));
  }

  // Check if user to be added exists
  const userResult = await context.userRepository.findById(input.userId);
  if (userResult.isErr()) {
    await context.logger.error("Failed to find user", userResult.error, {
      userId: input.userId,
    });
    return err(new ApplicationError("Failed to find user", userResult.error));
  }

  if (userResult.value === null) {
    return err(new ApplicationError("User not found"));
  }

  // Check if user is already a member
  const existingMemberResult = await context.teamRepository.findMember(
    input.teamId,
    input.userId,
  );
  if (existingMemberResult.isErr()) {
    await context.logger.error(
      "Failed to check existing membership",
      existingMemberResult.error,
      { teamId: input.teamId, userId: input.userId },
    );
    return err(
      new ApplicationError(
        "Failed to check existing membership",
        existingMemberResult.error,
      ),
    );
  }

  if (existingMemberResult.value !== null) {
    return err(new ApplicationError("User is already a team member"));
  }

  // Add team member
  const addResult = await context.teamRepository.addMember({
    teamId: input.teamId,
    userId: input.userId,
    roleId: input.roleId,
    invitedById: input.requesterId,
  });

  if (addResult.isErr()) {
    await context.logger.error("Failed to add team member", addResult.error, {
      teamId: input.teamId,
      userId: input.userId,
      roleId: input.roleId,
    });
    return err(
      new ApplicationError("Failed to add team member", addResult.error),
    );
  }

  return ok(addResult.value);
}
