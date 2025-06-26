import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type {
  CreateKeyResultInput,
  CreateObjectiveParams,
  KeyResult,
  KeyResultWithProgress,
  ListKeyResultsQuery,
  ListObjectivesQuery,
  Objective,
  ObjectiveWithKeyResults,
  OkrDashboardStats,
  UpdateKeyResultParams,
  UpdateKeyResultProgressParams,
  UpdateObjectiveParams,
} from "../types";

export class OkrRepositoryError extends AnyError {
  override readonly name = "OkrRepositoryError";
}

export interface OkrRepository {
  // Objective operations
  createObjective(
    params: CreateObjectiveParams,
  ): Promise<Result<Objective, OkrRepositoryError>>;

  findObjectiveById(
    id: string,
  ): Promise<Result<Objective | null, OkrRepositoryError>>;

  findObjectiveWithKeyResults(
    id: string,
  ): Promise<Result<ObjectiveWithKeyResults | null, OkrRepositoryError>>;

  updateObjective(
    params: UpdateObjectiveParams,
  ): Promise<Result<Objective, OkrRepositoryError>>;

  deleteObjective(id: string): Promise<Result<void, OkrRepositoryError>>;

  listObjectives(
    query: ListObjectivesQuery,
  ): Promise<Result<{ items: Objective[]; count: number }, OkrRepositoryError>>;

  listObjectivesWithKeyResults(
    query: ListObjectivesQuery,
  ): Promise<
    Result<
      { items: ObjectiveWithKeyResults[]; count: number },
      OkrRepositoryError
    >
  >;

  // Key Result operations
  createKeyResult(
    input: CreateKeyResultInput,
  ): Promise<Result<KeyResult, OkrRepositoryError>>;

  findKeyResultById(
    id: string,
  ): Promise<Result<KeyResult | null, OkrRepositoryError>>;

  findKeyResultWithProgress(
    id: string,
  ): Promise<Result<KeyResultWithProgress | null, OkrRepositoryError>>;

  updateKeyResult(
    params: UpdateKeyResultParams,
  ): Promise<Result<KeyResult, OkrRepositoryError>>;

  updateKeyResultProgress(
    params: UpdateKeyResultProgressParams,
  ): Promise<Result<KeyResult, OkrRepositoryError>>;

  deleteKeyResult(id: string): Promise<Result<void, OkrRepositoryError>>;

  listKeyResults(
    query: ListKeyResultsQuery,
  ): Promise<Result<{ items: KeyResult[]; count: number }, OkrRepositoryError>>;

  listKeyResultsWithProgress(
    query: ListKeyResultsQuery,
  ): Promise<
    Result<
      { items: KeyResultWithProgress[]; count: number },
      OkrRepositoryError
    >
  >;

  // Objective-specific Key Results
  listKeyResultsByObjective(
    objectiveId: string,
  ): Promise<Result<KeyResult[], OkrRepositoryError>>;

  listKeyResultsWithProgressByObjective(
    objectiveId: string,
  ): Promise<Result<KeyResultWithProgress[], OkrRepositoryError>>;

  // Dashboard and statistics
  getDashboardStats(
    userId: string,
    teamId?: string,
  ): Promise<Result<OkrDashboardStats, OkrRepositoryError>>;

  getObjectiveProgress(
    objectiveId: string,
  ): Promise<Result<number, OkrRepositoryError>>;

  // Ownership and access
  isObjectiveOwner(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>>;

  canUserAccessObjective(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>>;

  canUserEditObjective(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>>;
}
