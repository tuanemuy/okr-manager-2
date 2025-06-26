import { err, ok, type Result } from "neverthrow";
import type { OkrDashboardStats } from "@/core/domain/okr/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export async function getOKRDashboard(
  context: Context,
  userId: string,
  teamId?: string,
): Promise<Result<OkrDashboardStats, ApplicationError>> {
  // If teamId is provided, verify user is member of the team
  if (teamId) {
    const isMemberResult = await context.teamRepository.isUserMember(
      teamId,
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

  // Get dashboard stats
  const statsResult = await context.okrRepository.getDashboardStats(
    userId,
    teamId,
  );
  if (statsResult.isErr()) {
    return err(
      new ApplicationError(
        "Failed to retrieve dashboard stats",
        statsResult.error,
      ),
    );
  }

  return ok(statsResult.value);
}
