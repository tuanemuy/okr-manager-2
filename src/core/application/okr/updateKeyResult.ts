import { err, ok, type Result } from "neverthrow";
import type {
  KeyResult,
  UpdateKeyResultInput,
  UpdateKeyResultProgressInput,
} from "@/core/domain/okr/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function updateKeyResult(
  context: Context,
  userId: string,
  keyResultId: string,
  input: UpdateKeyResultInput,
): Promise<Result<KeyResult, ApplicationError>> {
  // Get key result
  const keyResultResult =
    await context.okrRepository.findKeyResultById(keyResultId);
  if (keyResultResult.isErr()) {
    await context.logger.error(
      "Failed to find key result",
      keyResultResult.error,
      { keyResultId, userId },
    );
    return err(
      new ApplicationError("Failed to find key result", keyResultResult.error),
    );
  }
  if (!keyResultResult.value) {
    return err(new ApplicationError("Key result not found"));
  }

  const keyResult = keyResultResult.value;

  // Check if user can edit the parent objective
  const canEditResult = await context.okrRepository.canUserEditObjective(
    keyResult.objectiveId,
    userId,
  );
  if (canEditResult.isErr()) {
    await context.logger.error(
      "Failed to check edit permissions",
      canEditResult.error,
      { objectiveId: keyResult.objectiveId, userId },
    );
    return err(
      new ApplicationError(
        "Failed to check edit permissions",
        canEditResult.error,
      ),
    );
  }
  if (!canEditResult.value) {
    return err(new ApplicationError("No permission to edit this key result"));
  }

  // Validate dates if provided
  if (input.startDate && input.endDate && input.startDate >= input.endDate) {
    return err(new ApplicationError("Start date must be before end date"));
  }

  // If changing dates, validate they are within objective dates
  if (input.startDate || input.endDate) {
    const objectiveResult = await context.okrRepository.findObjectiveById(
      keyResult.objectiveId,
    );
    if (objectiveResult.isErr() || !objectiveResult.value) {
      return err(new ApplicationError("Failed to find parent objective"));
    }

    const objective = objectiveResult.value;
    const newStartDate = input.startDate || keyResult.startDate;
    const newEndDate = input.endDate || keyResult.endDate;

    if (newStartDate < objective.startDate || newEndDate > objective.endDate) {
      return err(
        new ApplicationError(
          "Key result dates must be within objective date range",
        ),
      );
    }
  }

  // Validate target value based on type
  if (input.targetValue !== undefined) {
    const type = input.type || keyResult.type;

    if (
      type === "percentage" &&
      (input.targetValue < 0 || input.targetValue > 100)
    ) {
      return err(
        new ApplicationError(
          "Percentage target value must be between 0 and 100",
        ),
      );
    }

    if (type === "boolean" && input.targetValue !== 1) {
      return err(new ApplicationError("Boolean target value must be 1"));
    }

    if (type === "number" && input.targetValue < 0) {
      return err(
        new ApplicationError("Number target value must be non-negative"),
      );
    }
  }

  // Update key result
  const updateResult = await context.okrRepository.updateKeyResult({
    id: keyResultId,
    ...input,
  });

  if (updateResult.isErr()) {
    await context.logger.error(
      "Failed to update key result",
      updateResult.error,
      { keyResultId, userId },
    );
    return err(
      new ApplicationError("Failed to update key result", updateResult.error),
    );
  }

  return ok(updateResult.value);
}

export async function updateKeyResultProgress(
  context: Context,
  userId: string,
  keyResultId: string,
  input: UpdateKeyResultProgressInput,
): Promise<Result<KeyResult, ApplicationError>> {
  // Get key result
  const keyResultResult =
    await context.okrRepository.findKeyResultById(keyResultId);
  if (keyResultResult.isErr()) {
    await context.logger.error(
      "Failed to find key result",
      keyResultResult.error,
      { keyResultId, userId },
    );
    return err(
      new ApplicationError("Failed to find key result", keyResultResult.error),
    );
  }
  if (!keyResultResult.value) {
    return err(new ApplicationError("Key result not found"));
  }

  const keyResult = keyResultResult.value;

  // Check if user can edit the parent objective
  const canEditResult = await context.okrRepository.canUserEditObjective(
    keyResult.objectiveId,
    userId,
  );
  if (canEditResult.isErr()) {
    await context.logger.error(
      "Failed to check edit permissions",
      canEditResult.error,
      { objectiveId: keyResult.objectiveId, userId },
    );
    return err(
      new ApplicationError(
        "Failed to check edit permissions",
        canEditResult.error,
      ),
    );
  }
  if (!canEditResult.value) {
    return err(
      new ApplicationError("No permission to update this key result progress"),
    );
  }

  // Validate current value based on type
  if (
    keyResult.type === "percentage" &&
    (input.currentValue < 0 || input.currentValue > 100)
  ) {
    return err(
      new ApplicationError(
        "Percentage current value must be between 0 and 100",
      ),
    );
  }

  if (
    keyResult.type === "boolean" &&
    input.currentValue !== 0 &&
    input.currentValue !== 1
  ) {
    return err(new ApplicationError("Boolean current value must be 0 or 1"));
  }

  if (input.currentValue < 0) {
    return err(new ApplicationError("Current value must be non-negative"));
  }

  // Update progress
  const updateResult = await context.okrRepository.updateKeyResultProgress({
    id: keyResultId,
    currentValue: input.currentValue,
  });

  if (updateResult.isErr()) {
    await context.logger.error(
      "Failed to update key result progress",
      updateResult.error,
      { keyResultId, userId, currentValue: input.currentValue },
    );
    return err(
      new ApplicationError(
        "Failed to update key result progress",
        updateResult.error,
      ),
    );
  }

  return ok(updateResult.value);
}
