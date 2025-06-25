import { err, ok, type Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function deleteKeyResult(
  context: Context,
  userId: string,
  keyResultId: string,
): Promise<Result<void, ApplicationError>> {
  // Get key result
  const keyResultResult =
    await context.okrRepository.findKeyResultById(keyResultId);
  if (keyResultResult.isErr()) {
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
    return err(
      new ApplicationError(
        "Failed to check edit permissions",
        canEditResult.error,
      ),
    );
  }
  if (!canEditResult.value) {
    return err(new ApplicationError("No permission to delete this key result"));
  }

  // Delete key result
  const deleteResult = await context.okrRepository.deleteKeyResult(keyResultId);
  if (deleteResult.isErr()) {
    return err(
      new ApplicationError("Failed to delete key result", deleteResult.error),
    );
  }

  return ok(undefined);
}
