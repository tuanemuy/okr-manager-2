import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import { z } from "zod/v4";
import type { TeamInvitation } from "@/core/domain/team/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const inviteToTeamInputSchema = z.object({
  teamId: z.string().uuid(),
  email: z.string().email(),
  roleId: z.string().uuid(),
  requesterId: z.string().uuid(), // User making the request
});

export type InviteToTeamInput = z.infer<typeof inviteToTeamInputSchema>;

export async function inviteToTeam(
  context: Context,
  input: InviteToTeamInput,
): Promise<Result<TeamInvitation, ApplicationError>> {
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

  // Check if requester has permission to invite (must be creator or admin)
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
    // For now, only allow team creator to invite members
    return err(
      new ApplicationError("Insufficient permissions to invite members"),
    );
  }

  // Check if user with this email already exists and is a member
  const existingUserResult = await context.userRepository.findByEmail(
    input.email,
  );
  if (existingUserResult.isErr()) {
    await context.logger.error(
      "Failed to check existing user",
      existingUserResult.error,
      { email: input.email },
    );
    return err(
      new ApplicationError(
        "Failed to check existing user",
        existingUserResult.error,
      ),
    );
  }

  if (existingUserResult.value !== null) {
    // User exists, check if already a member
    const existingMemberResult = await context.teamRepository.findMember(
      input.teamId,
      existingUserResult.value.id,
    );
    if (existingMemberResult.isErr()) {
      await context.logger.error(
        "Failed to check existing membership",
        existingMemberResult.error,
        { teamId: input.teamId, userId: existingUserResult.value.id },
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
  }

  // Check if there's already a pending invitation
  // Note: Since there's no findInvitationByEmail method, we'll skip this check for now
  // TODO: Implement invitation lookup by email or list all invitations and check

  // Create invitation
  const invitationToken = uuidv7();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const createInvitationResult = await context.teamRepository.createInvitation({
    teamId: input.teamId,
    email: input.email,
    roleId: input.roleId,
    token: invitationToken,
    invitedById: input.requesterId,
    expiresAt,
  });

  if (createInvitationResult.isErr()) {
    await context.logger.error(
      "Failed to create invitation",
      createInvitationResult.error,
      { teamId: input.teamId, email: input.email, roleId: input.roleId },
    );
    return err(
      new ApplicationError(
        "Failed to create invitation",
        createInvitationResult.error,
      ),
    );
  }

  // Get requester info for email
  const requesterResult = await context.userRepository.findById(
    input.requesterId,
  );
  if (requesterResult.isErr()) {
    await context.logger.error(
      "Failed to find requester",
      requesterResult.error,
      { requesterId: input.requesterId },
    );
    return err(
      new ApplicationError("Failed to find requester", requesterResult.error),
    );
  }

  if (requesterResult.value === null) {
    return err(new ApplicationError("Requester not found"));
  }

  const requester = requesterResult.value;
  const invitationUrl = `${context.publicUrl}/team/join?token=${invitationToken}`;

  // Send invitation email
  const emailResult = await context.emailService.sendTeamInvitation(
    input.email,
    {
      inviterName: requester.name,
      teamName: team.name,
      invitationUrl,
    },
  );

  if (emailResult.isErr()) {
    // Log error but don't fail invitation creation
    await context.logger.error(
      "Failed to send invitation email",
      emailResult.error,
      { email: input.email, teamId: input.teamId },
    );
  }

  return ok(createInvitationResult.value);
}
