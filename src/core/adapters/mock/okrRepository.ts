import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import {
  type OkrRepository,
  OkrRepositoryError,
} from "@/core/domain/okr/ports/okrRepository";
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
} from "@/core/domain/okr/types";

export class MockOkrRepository implements OkrRepository {
  private objectives: Map<string, Objective> = new Map();
  private keyResults: Map<string, KeyResult> = new Map();
  private objectiveKeyResults: Map<string, Set<string>> = new Map();

  async createObjective(
    params: CreateObjectiveParams,
  ): Promise<Result<Objective, OkrRepositoryError>> {
    const id = uuidv7();
    const now = new Date();

    const objective: Objective = {
      id,
      title: params.title,
      description: params.description,
      type: params.type,
      ownerId: params.ownerId,
      teamId: params.teamId,
      parentId: params.parentId,
      startDate: params.startDate,
      endDate: params.endDate,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    this.objectives.set(id, objective);
    this.objectiveKeyResults.set(id, new Set());
    return ok(objective);
  }

  async findObjectiveById(
    id: string,
  ): Promise<Result<Objective | null, OkrRepositoryError>> {
    const objective = this.objectives.get(id);
    return ok(objective || null);
  }

  async findObjectiveWithKeyResults(
    id: string,
  ): Promise<Result<ObjectiveWithKeyResults | null, OkrRepositoryError>> {
    const objective = this.objectives.get(id);
    if (!objective) {
      return ok(null);
    }

    const keyResultIds = this.objectiveKeyResults.get(id) || new Set();
    const keyResults = Array.from(keyResultIds)
      .map((keyId) => this.keyResults.get(keyId))
      .filter((kr): kr is KeyResult => kr !== undefined);

    // Calculate progress percentage
    let progressPercentage = 0;
    if (keyResults.length > 0) {
      const totalProgress = keyResults.reduce((sum, kr) => {
        if (kr.type === "percentage") {
          return sum + (kr.currentValue / kr.targetValue) * 100;
        }
        if (kr.type === "boolean") {
          return sum + (kr.currentValue === kr.targetValue ? 100 : 0);
        }
        return sum + Math.min((kr.currentValue / kr.targetValue) * 100, 100);
      }, 0);
      progressPercentage = totalProgress / keyResults.length;
    }

    const objectiveWithKeyResults: ObjectiveWithKeyResults = {
      ...objective,
      keyResults,
      progressPercentage: Math.min(Math.max(progressPercentage, 0), 100),
    };

    return ok(objectiveWithKeyResults);
  }

  async updateObjective(
    params: UpdateObjectiveParams,
  ): Promise<Result<Objective, OkrRepositoryError>> {
    const objective = this.objectives.get(params.id);
    if (!objective) {
      return err(new OkrRepositoryError("Objective not found"));
    }

    const updatedObjective: Objective = {
      ...objective,
      title: params.title ?? objective.title,
      description: params.description ?? objective.description,
      type: params.type ?? objective.type,
      teamId: params.teamId ?? objective.teamId,
      parentId: params.parentId ?? objective.parentId,
      startDate: params.startDate ?? objective.startDate,
      endDate: params.endDate ?? objective.endDate,
      status: params.status ?? objective.status,
      updatedAt: new Date(),
    };

    this.objectives.set(params.id, updatedObjective);
    return ok(updatedObjective);
  }

  async deleteObjective(id: string): Promise<Result<void, OkrRepositoryError>> {
    if (!this.objectives.has(id)) {
      return err(new OkrRepositoryError("Objective not found"));
    }

    // Delete all associated key results
    const keyResultIds = this.objectiveKeyResults.get(id) || new Set();
    for (const keyResultId of keyResultIds) {
      this.keyResults.delete(keyResultId);
    }

    this.objectives.delete(id);
    this.objectiveKeyResults.delete(id);
    return ok(undefined);
  }

  async listObjectives(
    query: ListObjectivesQuery,
  ): Promise<
    Result<{ items: Objective[]; count: number }, OkrRepositoryError>
  > {
    let objectives = Array.from(this.objectives.values());

    // Apply filters
    if (query.filter?.search) {
      const searchTerm = query.filter.search.toLowerCase();
      objectives = objectives.filter(
        (obj) =>
          obj.title.toLowerCase().includes(searchTerm) ||
          obj.description?.toLowerCase().includes(searchTerm),
      );
    }

    if (query.filter?.type) {
      objectives = objectives.filter((obj) => obj.type === query.filter?.type);
    }

    if (query.filter?.status) {
      objectives = objectives.filter(
        (obj) => obj.status === query.filter?.status,
      );
    }

    if (query.filter?.ownerId) {
      objectives = objectives.filter(
        (obj) => obj.ownerId === query.filter?.ownerId,
      );
    }

    if (query.filter?.teamId) {
      objectives = objectives.filter(
        (obj) => obj.teamId === query.filter?.teamId,
      );
    }

    // Apply pagination
    const startIndex = (query.pagination.page - 1) * query.pagination.limit;
    const endIndex = startIndex + query.pagination.limit;
    const paginatedObjectives = objectives.slice(startIndex, endIndex);

    return ok({
      items: paginatedObjectives,
      count: objectives.length,
    });
  }

  async listObjectivesWithKeyResults(
    query: ListObjectivesQuery,
  ): Promise<
    Result<
      { items: ObjectiveWithKeyResults[]; count: number },
      OkrRepositoryError
    >
  > {
    const listResult = await this.listObjectives(query);
    if (listResult.isErr()) {
      return err(listResult.error);
    }

    const objectivesWithKeyResults: ObjectiveWithKeyResults[] = [];
    for (const objective of listResult.value.items) {
      const withKeyResultsResult = await this.findObjectiveWithKeyResults(
        objective.id,
      );
      if (withKeyResultsResult.isOk() && withKeyResultsResult.value) {
        objectivesWithKeyResults.push(withKeyResultsResult.value);
      }
    }

    return ok({
      items: objectivesWithKeyResults,
      count: listResult.value.count,
    });
  }

  async createKeyResult(
    input: CreateKeyResultInput,
  ): Promise<Result<KeyResult, OkrRepositoryError>> {
    const id = uuidv7();
    const now = new Date();

    const keyResult: KeyResult = {
      id,
      objectiveId: input.objectiveId,
      title: input.title,
      description: input.description,
      type: input.type,
      targetValue: input.targetValue,
      currentValue: 0, // Default starting value
      unit: input.unit,
      startDate: input.startDate,
      endDate: input.endDate,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.keyResults.set(id, keyResult);

    // Add to objective's key results
    const objectiveKeyResults =
      this.objectiveKeyResults.get(input.objectiveId) || new Set();
    objectiveKeyResults.add(id);
    this.objectiveKeyResults.set(input.objectiveId, objectiveKeyResults);

    return ok(keyResult);
  }

  async findKeyResultById(
    id: string,
  ): Promise<Result<KeyResult | null, OkrRepositoryError>> {
    const keyResult = this.keyResults.get(id);
    return ok(keyResult || null);
  }

  async findKeyResultWithProgress(
    id: string,
  ): Promise<Result<KeyResultWithProgress | null, OkrRepositoryError>> {
    const keyResult = this.keyResults.get(id);
    if (!keyResult) {
      return ok(null);
    }

    let progressPercentage = 0;
    if (keyResult.type === "percentage") {
      progressPercentage =
        (keyResult.currentValue / keyResult.targetValue) * 100;
    } else if (keyResult.type === "boolean") {
      progressPercentage =
        keyResult.currentValue === keyResult.targetValue ? 100 : 0;
    } else {
      // number
      progressPercentage = Math.min(
        (keyResult.currentValue / keyResult.targetValue) * 100,
        100,
      );
    }

    const keyResultWithProgress: KeyResultWithProgress = {
      ...keyResult,
      progressPercentage: Math.min(Math.max(progressPercentage, 0), 100),
    };

    return ok(keyResultWithProgress);
  }

  async updateKeyResult(
    params: UpdateKeyResultParams,
  ): Promise<Result<KeyResult, OkrRepositoryError>> {
    const keyResult = this.keyResults.get(params.id);
    if (!keyResult) {
      return err(new OkrRepositoryError("Key result not found"));
    }

    const updatedKeyResult: KeyResult = {
      ...keyResult,
      title: params.title ?? keyResult.title,
      description: params.description ?? keyResult.description,
      type: params.type ?? keyResult.type,
      targetValue: params.targetValue ?? keyResult.targetValue,
      unit: params.unit ?? keyResult.unit,
      startDate: params.startDate ?? keyResult.startDate,
      endDate: params.endDate ?? keyResult.endDate,
      status: params.status ?? keyResult.status,
      updatedAt: new Date(),
    };

    this.keyResults.set(params.id, updatedKeyResult);
    return ok(updatedKeyResult);
  }

  async updateKeyResultProgress(
    params: UpdateKeyResultProgressParams,
  ): Promise<Result<KeyResult, OkrRepositoryError>> {
    const keyResult = this.keyResults.get(params.id);
    if (!keyResult) {
      return err(new OkrRepositoryError("Key result not found"));
    }

    const updatedKeyResult: KeyResult = {
      ...keyResult,
      currentValue: params.currentValue,
      updatedAt: new Date(),
    };

    this.keyResults.set(params.id, updatedKeyResult);
    return ok(updatedKeyResult);
  }

  async deleteKeyResult(id: string): Promise<Result<void, OkrRepositoryError>> {
    const keyResult = this.keyResults.get(id);
    if (!keyResult) {
      return err(new OkrRepositoryError("Key result not found"));
    }

    // Remove from objective's key results
    const objectiveKeyResults = this.objectiveKeyResults.get(
      keyResult.objectiveId,
    );
    if (objectiveKeyResults) {
      objectiveKeyResults.delete(id);
    }

    this.keyResults.delete(id);
    return ok(undefined);
  }

  async listKeyResults(
    query: ListKeyResultsQuery,
  ): Promise<
    Result<{ items: KeyResult[]; count: number }, OkrRepositoryError>
  > {
    let keyResults = Array.from(this.keyResults.values());

    // Apply filters
    if (query.filter?.search) {
      const searchTerm = query.filter.search.toLowerCase();
      keyResults = keyResults.filter(
        (kr) =>
          kr.title.toLowerCase().includes(searchTerm) ||
          kr.description?.toLowerCase().includes(searchTerm),
      );
    }

    if (query.filter?.objectiveId) {
      keyResults = keyResults.filter(
        (kr) => kr.objectiveId === query.filter?.objectiveId,
      );
    }

    if (query.filter?.type) {
      keyResults = keyResults.filter((kr) => kr.type === query.filter?.type);
    }

    if (query.filter?.status) {
      keyResults = keyResults.filter(
        (kr) => kr.status === query.filter?.status,
      );
    }

    // Apply pagination
    const startIndex = (query.pagination.page - 1) * query.pagination.limit;
    const endIndex = startIndex + query.pagination.limit;
    const paginatedKeyResults = keyResults.slice(startIndex, endIndex);

    return ok({
      items: paginatedKeyResults,
      count: keyResults.length,
    });
  }

  async listKeyResultsWithProgress(
    query: ListKeyResultsQuery,
  ): Promise<
    Result<
      { items: KeyResultWithProgress[]; count: number },
      OkrRepositoryError
    >
  > {
    const listResult = await this.listKeyResults(query);
    if (listResult.isErr()) {
      return err(listResult.error);
    }

    const keyResultsWithProgress: KeyResultWithProgress[] = [];
    for (const keyResult of listResult.value.items) {
      const withProgressResult = await this.findKeyResultWithProgress(
        keyResult.id,
      );
      if (withProgressResult.isOk() && withProgressResult.value) {
        keyResultsWithProgress.push(withProgressResult.value);
      }
    }

    return ok({
      items: keyResultsWithProgress,
      count: listResult.value.count,
    });
  }

  async listKeyResultsByObjective(
    objectiveId: string,
  ): Promise<Result<KeyResult[], OkrRepositoryError>> {
    const keyResultIds = this.objectiveKeyResults.get(objectiveId) || new Set();
    const keyResults = Array.from(keyResultIds)
      .map((id) => this.keyResults.get(id))
      .filter((kr): kr is KeyResult => kr !== undefined);

    return ok(keyResults);
  }

  async listKeyResultsWithProgressByObjective(
    objectiveId: string,
  ): Promise<Result<KeyResultWithProgress[], OkrRepositoryError>> {
    const keyResultsResult = await this.listKeyResultsByObjective(objectiveId);
    if (keyResultsResult.isErr()) {
      return err(keyResultsResult.error);
    }

    const keyResultsWithProgress: KeyResultWithProgress[] = [];
    for (const keyResult of keyResultsResult.value) {
      const withProgressResult = await this.findKeyResultWithProgress(
        keyResult.id,
      );
      if (withProgressResult.isOk() && withProgressResult.value) {
        keyResultsWithProgress.push(withProgressResult.value);
      }
    }

    return ok(keyResultsWithProgress);
  }

  async getDashboardStats(
    _userId: string,
    _teamId?: string,
  ): Promise<Result<OkrDashboardStats, OkrRepositoryError>> {
    // Simplified implementation for testing
    const stats: OkrDashboardStats = {
      totalObjectives: this.objectives.size,
      activeObjectives: Array.from(this.objectives.values()).filter(
        (obj) => obj.status === "active",
      ).length,
      completedObjectives: Array.from(this.objectives.values()).filter(
        (obj) => obj.status === "completed",
      ).length,
      totalKeyResults: this.keyResults.size,
      completedKeyResults: Array.from(this.keyResults.values()).filter(
        (kr) => kr.status === "completed",
      ).length,
      averageProgress: 50, // Simplified
      onTrackCount: 0,
      atRiskCount: 0,
      behindCount: 0,
    };

    return ok(stats);
  }

  async getObjectiveProgress(
    objectiveId: string,
  ): Promise<Result<number, OkrRepositoryError>> {
    const objectiveWithKeyResults =
      await this.findObjectiveWithKeyResults(objectiveId);
    if (objectiveWithKeyResults.isErr()) {
      return err(objectiveWithKeyResults.error);
    }
    if (!objectiveWithKeyResults.value) {
      return err(new OkrRepositoryError("Objective not found"));
    }

    return ok(objectiveWithKeyResults.value.progressPercentage);
  }

  async isObjectiveOwner(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>> {
    const objective = this.objectives.get(objectiveId);
    if (!objective) {
      return ok(false);
    }
    return ok(objective.ownerId === userId);
  }

  async canUserAccessObjective(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>> {
    const objective = this.objectives.get(objectiveId);
    if (!objective) {
      return ok(false);
    }

    // User can access if they own it
    if (objective.ownerId === userId) {
      return ok(true);
    }

    // For team/organization objectives, assume user has access for testing
    if (objective.type === "team" || objective.type === "organization") {
      return ok(true);
    }

    // Personal objectives can only be accessed by the owner
    return ok(false);
  }

  async canUserEditObjective(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>> {
    const objective = this.objectives.get(objectiveId);
    if (!objective) {
      return ok(false);
    }

    // Simplified: only owner can edit
    return ok(objective.ownerId === userId);
  }

  // Helper methods for testing
  clear(): void {
    this.objectives.clear();
    this.keyResults.clear();
    this.objectiveKeyResults.clear();
  }

  seedObjectives(objectives: Objective[]): void {
    for (const objective of objectives) {
      this.objectives.set(objective.id, objective);
      if (!this.objectiveKeyResults.has(objective.id)) {
        this.objectiveKeyResults.set(objective.id, new Set());
      }
    }
  }

  seedKeyResults(keyResults: KeyResult[]): void {
    for (const keyResult of keyResults) {
      this.keyResults.set(keyResult.id, keyResult);

      const objectiveKeyResults =
        this.objectiveKeyResults.get(keyResult.objectiveId) || new Set();
      objectiveKeyResults.add(keyResult.id);
      this.objectiveKeyResults.set(keyResult.objectiveId, objectiveKeyResults);
    }
  }
}
