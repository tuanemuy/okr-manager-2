import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { TeamMember } from "@/core/domain/team/types";
import { ApplicationError } from "../auth/register";
import type { Context } from "../context";

export const listTeamMembersInputSchema = z.object({
  teamId: z.string().uuid(),
  requesterId: z.string().uuid(), // User making the request
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

export type ListTeamMembersInput = z.infer<typeof listTeamMembersInputSchema>;

export async function listTeamMembers(
  context: Context,
  input: ListTeamMembersInput,
): Promise<Result<{ items: TeamMember[]; count: number }, ApplicationError>> {
  // Check if requester has access to this team (must be a member)
  const isMemberResult = await context.teamRepository.isUserMember(
    input.teamId,
    input.requesterId,
  );
  if (isMemberResult.isErr()) {
    await context.logger.error(
      "Failed to check team membership",
      isMemberResult.error,
      { teamId: input.teamId, requesterId: input.requesterId },
    );
    return err(
      new ApplicationError(
        "Failed to check team membership",
        isMemberResult.error,
      ),
    );
  }

  if (!isMemberResult.value) {
    return err(new ApplicationError("Access denied - not a team member"));
  }

  const membersResult = await context.teamRepository.listMembers(input.teamId, {
    pagination: {
      page: input.page,
      limit: input.limit,
      order: "asc",
      orderBy: "createdAt",
    },
    filter: { status: "active" },
  });

  if (membersResult.isErr()) {
    await context.logger.error(
      "Failed to fetch team members",
      membersResult.error,
      { teamId: input.teamId, requesterId: input.requesterId },
    );
    return err(
      new ApplicationError("Failed to fetch team members", membersResult.error),
    );
  }

  return ok(membersResult.value);
}
