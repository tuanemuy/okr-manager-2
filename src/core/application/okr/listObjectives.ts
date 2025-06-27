import { err, ok, type Result } from "neverthrow";
import type {
  ListObjectivesQuery,
  ObjectiveWithKeyResults,
} from "@/core/domain/okr/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function listObjectives(
  context: Context,
  _userId: string, // TODO: Implement proper access control
  query: ListObjectivesQuery,
  includeKeyResults = false,
): Promise<
  Result<{ items: ObjectiveWithKeyResults[]; count: number }, ApplicationError>
> {
  // TODO: Get user's teams to filter accessible objectives
  // Currently simplified - user can see all team objectives
  // const _teamIds: string[] = [];

  // Build filter with access control - simplified version
  const accessControlFilter = {
    ...query.filter,
    // For now, apply no additional access control filtering
    // TODO: Implement proper access control based on team membership and permissions
  };

  // TODO: Check if user has permission to view organization objectives
  // const permissionsResult = await context.roleRepository.getUserPermissions(_userId);
  // if (permissionsResult.isOk()) {
  //   const hasOrgPermission = permissionsResult.value.some(
  //     (permission) => permission.name === "view_organization_objectives",
  //   );
  //   // Apply additional filtering based on permissions
  // }

  // Get objectives with or without key results
  let result: Result<
    { items: ObjectiveWithKeyResults[]; count: number },
    ApplicationError
  >;
  if (includeKeyResults) {
    const objectivesResult =
      await context.okrRepository.listObjectivesWithKeyResults({
        ...query,
        filter: accessControlFilter,
      });
    if (objectivesResult.isErr()) {
      await context.logger.error(
        "Failed to list objectives with key results",
        objectivesResult.error,
        { query },
      );
      return err(
        new ApplicationError(
          "Failed to list objectives with key results",
          objectivesResult.error,
        ),
      );
    }
    result = ok(objectivesResult.value);
  } else {
    // Convert regular objectives to ObjectiveWithKeyResults format with empty keyResults
    const objectivesResult = await context.okrRepository.listObjectives({
      ...query,
      filter: accessControlFilter,
    });

    if (objectivesResult.isErr()) {
      await context.logger.error(
        "Failed to list objectives",
        objectivesResult.error,
        { query },
      );
      return err(
        new ApplicationError(
          "Failed to list objectives",
          objectivesResult.error,
        ),
      );
    }

    // Calculate progress for each objective
    const itemsWithProgress = await Promise.all(
      objectivesResult.value.items.map(async (objective) => {
        const progressResult = await context.okrRepository.getObjectiveProgress(
          objective.id,
        );
        const progressPercentage = progressResult.isOk()
          ? progressResult.value
          : 0;

        return {
          ...objective,
          keyResults: [],
          progressPercentage,
        };
      }),
    );

    result = ok({
      items: itemsWithProgress,
      count: objectivesResult.value.count,
    });
  }

  if (result.isErr()) {
    return err(new ApplicationError("Failed to list objectives", result.error));
  }

  return ok(result.value);
}
