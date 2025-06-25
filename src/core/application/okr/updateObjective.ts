import { err, ok, type Result } from "neverthrow";
import type { Objective, UpdateObjectiveInput } from "@/core/domain/okr/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function updateObjective(
  context: Context,
  userId: string,
  objectiveId: string,
  input: UpdateObjectiveInput,
): Promise<Result<Objective, ApplicationError>> {
  // Check if objective exists
  const objectiveResult =
    await context.okrRepository.findObjectiveById(objectiveId);
  if (objectiveResult.isErr()) {
    return err(
      new ApplicationError("Failed to find objective", objectiveResult.error),
    );
  }
  if (!objectiveResult.value) {
    return err(new ApplicationError("Objective not found"));
  }

  const objective = objectiveResult.value;

  // Check if user can edit objective
  const canEditResult = await context.okrRepository.canUserEditObjective(
    objectiveId,
    userId,
  );
  if (canEditResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check edit permissions",
        canEditResult.error,
      ),
    );
  }
  if (!canEditResult.value) {
    return err(new ApplicationError("No permission to edit this objective"));
  }

  // Validate dates if provided
  if (input.startDate && input.endDate && input.startDate >= input.endDate) {
    return err(new ApplicationError("Start date must be before end date"));
  }

  // If changing to team objective, verify user is member of the team
  if (
    input.type === "team" &&
    input.teamId &&
    input.teamId !== objective.teamId
  ) {
    const isMemberResult = await context.teamRepository.isUserMember(
      input.teamId,
      userId,
    );
    if (isMemberResult.isErr()) {
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

  // If changing to organization objective, verify user has permission
  if (input.type === "organization" && objective.type !== "organization") {
    const permissionsResult =
      await context.roleRepository.getUserPermissions(userId);
    if (permissionsResult.isErr()) {
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

  // If changing parentId, verify parent objective exists and user has access
  if (input.parentId && input.parentId !== objective.parentId) {
    const parentResult = await context.okrRepository.findObjectiveById(
      input.parentId,
    );
    if (parentResult.isErr()) {
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

    // Prevent circular references
    if (input.parentId === objectiveId) {
      return err(new ApplicationError("Objective cannot be its own parent"));
    }
  }

  // Update objective
  const updateResult = await context.okrRepository.updateObjective({
    id: objectiveId,
    ...input,
  });

  if (updateResult.isErr()) {
    return err(
      new ApplicationError("Failed to update objective", updateResult.error),
    );
  }

  return ok(updateResult.value);
}
