import { err, ok, type Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function deleteObjective(
  context: Context,
  userId: string,
  objectiveId: string,
): Promise<Result<void, ApplicationError>> {
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

  // Check if user can edit objective (only owners or admins can delete)
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
    return err(new ApplicationError("No permission to delete this objective"));
  }

  // TODO: Check if objective has child objectives
  // Currently not implemented due to lack of parentId filter in listObjectives

  // Delete objective (this will cascade delete related key results)
  const deleteResult = await context.okrRepository.deleteObjective(objectiveId);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete objective", deleteResult.error),
    );
  }

  return ok(undefined);
}
