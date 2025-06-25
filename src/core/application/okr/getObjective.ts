import { err, ok, type Result } from "neverthrow";
import type { ObjectiveWithKeyResults } from "@/core/domain/okr/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function getObjective(
  context: Context,
  userId: string,
  objectiveId: string,
): Promise<Result<ObjectiveWithKeyResults, ApplicationError>> {
  // Check if user can access objective
  const canAccessResult = await context.okrRepository.canUserAccessObjective(
    objectiveId,
    userId,
  );
  if (canAccessResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to check access permissions",
        canAccessResult.error,
      ),
    );
  }
  if (!canAccessResult.value) {
    return err(new ApplicationError("No permission to access this objective"));
  }

  // Get objective with key results
  const objectiveResult =
    await context.okrRepository.findObjectiveWithKeyResults(objectiveId);
  if (objectiveResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to retrieve objective",
        objectiveResult.error,
      ),
    );
  }
  if (!objectiveResult.value) {
    return err(new ApplicationError("Objective not found"));
  }

  return ok(objectiveResult.value);
}
