import { err, ok, type Result } from "neverthrow";
import type { CreateObjectiveInput, Objective } from "@/core/domain/okr/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function createObjective(
  context: Context,
  userId: string,
  input: CreateObjectiveInput,
): Promise<Result<Objective, ApplicationError>> {
  // Validate dates
  if (input.startDate >= input.endDate) {
    return err(new ApplicationError("Start date must be before end date"));
  }

  // If creating a team objective, verify user is member of the team
  if (input.type === "team" && input.teamId) {
    const isMemberResult = await context.teamRepository.isUserMember(
      input.teamId,
      userId,
    );
    if (isMemberResult.isErr()) {
      await context.logger.error(
        "Failed to check team membership",
        isMemberResult.error,
        { teamId: input.teamId, userId },
      );
      return err(
        new ApplicationError(
          "Failed to check team membership",
          isMemberResult.error,
        ),
      );
    }
    if (!isMemberResult.value) {
      return err(new ApplicationError("User is not a member of the team"));
    }
  }

  // If creating an organization objective, verify user has permission
  if (input.type === "organization") {
    const permissionsResult =
      await context.roleRepository.getUserPermissions(userId);
    if (permissionsResult.isErr()) {
      await context.logger.error(
        "Failed to check permissions",
        permissionsResult.error,
        { userId },
      );
      return err(
        new ApplicationError(
          "Failed to check permissions",
          permissionsResult.error,
        ),
      );
    }
    const hasPermission = permissionsResult.value.some(
      (permission) => permission.name === "manage_organization_objectives",
    );
    if (!hasPermission) {
      return err(
        new ApplicationError(
          "User does not have permission to create organization objectives",
        ),
      );
    }
  }

  // If parentId is provided, verify parent objective exists and user has access
  if (input.parentId) {
    const parentResult = await context.okrRepository.findObjectiveById(
      input.parentId,
    );
    if (parentResult.isErr()) {
      await context.logger.error(
        "Failed to find parent objective",
        parentResult.error,
        { parentId: input.parentId, userId },
      );
      return err(
        new ApplicationError(
          "Failed to find parent objective",
          parentResult.error,
        ),
      );
    }
    if (!parentResult.value) {
      return err(new ApplicationError("Parent objective not found"));
    }

    const canAccessResult = await context.okrRepository.canUserAccessObjective(
      input.parentId,
      userId,
    );
    if (canAccessResult.isErr()) {
      await context.logger.error(
        "Failed to check access to parent objective",
        canAccessResult.error,
        { parentId: input.parentId, userId },
      );
      return err(
        new ApplicationError(
          "Failed to check access to parent objective",
          canAccessResult.error,
        ),
      );
    }
    if (!canAccessResult.value) {
      return err(new ApplicationError("No access to parent objective"));
    }
  }

  // Create objective
  const createResult = await context.okrRepository.createObjective({
    ...input,
    ownerId: userId,
  });

  if (createResult.isErr()) {
    await context.logger.error(
      "Failed to create objective",
      createResult.error,
      { userId, title: input.title, type: input.type, teamId: input.teamId },
    );
    return err(
      new ApplicationError("Failed to create objective", createResult.error),
    );
  }

  return ok(createResult.value);
}
