import { err, ok, type Result } from "neverthrow";
import type { CreateKeyResultInput, KeyResult } from "@/core/domain/okr/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function createKeyResult(
  context: Context,
  userId: string,
  input: CreateKeyResultInput,
): Promise<Result<KeyResult, ApplicationError>> {
  // Check if objective exists
  const objectiveResult = await context.okrRepository.findObjectiveById(
    input.objectiveId,
  );
  if (objectiveResult.isErr()) {
    return err(
      new ApplicationError("Failed to find objective", objectiveResult.error),
    );
  }
  if (!objectiveResult.value) {
    return err(new ApplicationError("Objective not found"));
  }

  // Check if user can edit objective (to add key results)
  const canEditResult = await context.okrRepository.canUserEditObjective(
    input.objectiveId,
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
    return err(
      new ApplicationError(
        "No permission to add key results to this objective",
      ),
    );
  }

  // Validate dates
  if (input.startDate >= input.endDate) {
    return err(new ApplicationError("Start date must be before end date"));
  }

  // Validate key result dates are within objective dates
  const objective = objectiveResult.value;
  if (
    input.startDate < objective.startDate ||
    input.endDate > objective.endDate
  ) {
    return err(
      new ApplicationError(
        "Key result dates must be within objective date range",
      ),
    );
  }

  // Validate target value based on type
  if (
    input.type === "percentage" &&
    (input.targetValue < 0 || input.targetValue > 100)
  ) {
    return err(
      new ApplicationError("Percentage target value must be between 0 and 100"),
    );
  }

  if (input.type === "boolean" && input.targetValue !== 1) {
    return err(new ApplicationError("Boolean target value must be 1"));
  }

  if (input.type === "number" && input.targetValue < 0) {
    return err(
      new ApplicationError("Number target value must be non-negative"),
    );
  }

  // Create key result
  const createResult = await context.okrRepository.createKeyResult(input);
  if (createResult.isErr()) {
    return err(
      new ApplicationError("Failed to create key result", createResult.error),
    );
  }

  return ok(createResult.value);
}
