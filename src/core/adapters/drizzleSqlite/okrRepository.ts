import { and, avg, count, eq, like, or, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type {
  OkrRepository,
  OkrRepositoryError,
} from "@/core/domain/okr/ports/okrRepository";
import { OkrRepositoryError as OkrRepoError } from "@/core/domain/okr/ports/okrRepository";
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
import {
  keyResultSchema,
  keyResultWithProgressSchema,
  objectiveSchema,
  objectiveWithKeyResultsSchema,
  okrDashboardStatsSchema,
} from "@/core/domain/okr/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { keyResults, objectives, teamMembers } from "./schema";

export class DrizzleSqliteOkrRepository implements OkrRepository {
  constructor(private readonly db: Database) {}

  // Objective operations
  async createObjective(
    params: CreateObjectiveParams,
  ): Promise<Result<Objective, OkrRepositoryError>> {
    try {
      const result = await this.db
        .insert(objectives)
        .values({
          title: params.title,
          description: params.description,
          type: params.type,
          ownerId: params.ownerId,
          teamId: params.teamId,
          parentId: params.parentId,
          startDate: params.startDate,
          endDate: params.endDate,
          status: "draft",
        })
        .returning();

      const objective = Array.isArray(result) ? result[0] : result;
      if (!objective) {
        return err(new OkrRepoError("Failed to create objective"));
      }

      return validate(objectiveSchema, objective).mapErr((error) => {
        return new OkrRepoError("Invalid objective data", error);
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to create objective", error));
    }
  }

  async findObjectiveById(
    id: string,
  ): Promise<Result<Objective | null, OkrRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(objectives)
        .where(eq(objectives.id, id))
        .limit(1);

      const objective = result[0];
      if (!objective) {
        return ok(null);
      }

      return validate(objectiveSchema, objective).mapErr((error) => {
        return new OkrRepoError("Invalid objective data", error);
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to find objective", error));
    }
  }

  async findObjectiveWithKeyResults(
    id: string,
  ): Promise<Result<ObjectiveWithKeyResults | null, OkrRepositoryError>> {
    try {
      const objectiveResult = await this.findObjectiveById(id);
      if (objectiveResult.isErr()) return err(objectiveResult.error);
      if (!objectiveResult.value) return ok(null);

      const keyResultsResult = await this.listKeyResultsByObjective(id);
      if (keyResultsResult.isErr()) return err(keyResultsResult.error);

      const progressResult = await this.getObjectiveProgress(id);
      if (progressResult.isErr()) return err(progressResult.error);

      const objectiveWithKeyResults = {
        ...objectiveResult.value,
        keyResults: keyResultsResult.value,
        progressPercentage: progressResult.value,
      };

      return validate(
        objectiveWithKeyResultsSchema,
        objectiveWithKeyResults,
      ).mapErr((error) => {
        return new OkrRepoError(
          "Invalid objective with key results data",
          error,
        );
      });
    } catch (error) {
      return err(
        new OkrRepoError("Failed to find objective with key results", error),
      );
    }
  }

  async updateObjective(
    params: UpdateObjectiveParams,
  ): Promise<Result<Objective, OkrRepositoryError>> {
    try {
      const updateData: Partial<typeof objectives.$inferInsert> = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.type !== undefined) updateData.type = params.type;
      if (params.teamId !== undefined) updateData.teamId = params.teamId;
      if (params.parentId !== undefined) updateData.parentId = params.parentId;
      if (params.startDate !== undefined)
        updateData.startDate = params.startDate;
      if (params.endDate !== undefined) updateData.endDate = params.endDate;
      if (params.status !== undefined) updateData.status = params.status;

      if (Object.keys(updateData).length === 0) {
        const existingObjective = await this.findObjectiveById(params.id);
        if (existingObjective.isErr()) return err(existingObjective.error);
        if (!existingObjective.value) {
          return err(new OkrRepoError("Objective not found"));
        }
        return ok(existingObjective.value);
      }

      const result = await this.db
        .update(objectives)
        .set(updateData)
        .where(eq(objectives.id, params.id))
        .returning();

      const objective = Array.isArray(result) ? result[0] : result;
      if (!objective) {
        return err(new OkrRepoError("Objective not found"));
      }

      return validate(objectiveSchema, objective).mapErr((error) => {
        return new OkrRepoError("Invalid objective data", error);
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to update objective", error));
    }
  }

  async deleteObjective(id: string): Promise<Result<void, OkrRepositoryError>> {
    try {
      const result = await this.db
        .delete(objectives)
        .where(eq(objectives.id, id));

      if (result.rowsAffected === 0) {
        return err(new OkrRepoError("Objective not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new OkrRepoError("Failed to delete objective", error));
    }
  }

  async listObjectives(
    query: ListObjectivesQuery,
  ): Promise<
    Result<{ items: Objective[]; count: number }, OkrRepositoryError>
  > {
    try {
      const { pagination, filter, sort } = query;
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const whereConditions = [];

      if (filter?.search) {
        whereConditions.push(
          or(
            like(objectives.title, `%${filter.search}%`),
            like(objectives.description, `%${filter.search}%`),
          ),
        );
      }

      if (filter?.type) {
        whereConditions.push(eq(objectives.type, filter.type));
      }

      if (filter?.status) {
        whereConditions.push(eq(objectives.status, filter.status));
      }

      if (filter?.ownerId) {
        whereConditions.push(eq(objectives.ownerId, filter.ownerId));
      }

      if (filter?.teamId) {
        whereConditions.push(eq(objectives.teamId, filter.teamId));
      }

      if (filter?.startDate) {
        whereConditions.push(
          sql`${objectives.startDate} >= ${filter.startDate}`,
        );
      }

      if (filter?.endDate) {
        whereConditions.push(sql`${objectives.endDate} <= ${filter.endDate}`);
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const countResult = await this.db
        .select({ count: count() })
        .from(objectives)
        .where(whereClause);

      const totalCount = countResult[0]?.count ?? 0;

      // Build order by clause
      let orderBy = sql`${objectives.createdAt} desc`;
      if (sort?.field && sort?.direction) {
        const field = objectives[sort.field as keyof typeof objectives];
        if (field) {
          orderBy =
            sort.direction === "asc" ? sql`${field} asc` : sql`${field} desc`;
        }
      }

      // Get objectives
      const objectivesResult = await this.db
        .select()
        .from(objectives)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const validatedObjectives = [];
      for (const objective of objectivesResult) {
        const validationResult = validate(objectiveSchema, objective);
        if (validationResult.isErr()) {
          return err(
            new OkrRepoError("Invalid objective data", validationResult.error),
          );
        }
        validatedObjectives.push(validationResult.value);
      }

      return ok({
        items: validatedObjectives,
        count: totalCount,
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to list objectives", error));
    }
  }

  async listObjectivesWithKeyResults(
    query: ListObjectivesQuery,
  ): Promise<
    Result<
      { items: ObjectiveWithKeyResults[]; count: number },
      OkrRepositoryError
    >
  > {
    try {
      const objectivesResult = await this.listObjectives(query);
      if (objectivesResult.isErr()) return err(objectivesResult.error);

      const objectivesWithKeyResults = [];
      for (const objective of objectivesResult.value.items) {
        const keyResultsResult = await this.listKeyResultsByObjective(
          objective.id,
        );
        if (keyResultsResult.isErr()) return err(keyResultsResult.error);

        const progressResult = await this.getObjectiveProgress(objective.id);
        if (progressResult.isErr()) return err(progressResult.error);

        const objectiveWithKeyResults = {
          ...objective,
          keyResults: keyResultsResult.value,
          progressPercentage: progressResult.value,
        };

        const validationResult = validate(
          objectiveWithKeyResultsSchema,
          objectiveWithKeyResults,
        );
        if (validationResult.isErr()) {
          return err(
            new OkrRepoError(
              "Invalid objective with key results data",
              validationResult.error,
            ),
          );
        }
        objectivesWithKeyResults.push(validationResult.value);
      }

      return ok({
        items: objectivesWithKeyResults,
        count: objectivesResult.value.count,
      });
    } catch (error) {
      return err(
        new OkrRepoError("Failed to list objectives with key results", error),
      );
    }
  }

  // Key Result operations
  async createKeyResult(
    input: CreateKeyResultInput,
  ): Promise<Result<KeyResult, OkrRepositoryError>> {
    try {
      const result = await this.db
        .insert(keyResults)
        .values({
          objectiveId: input.objectiveId,
          title: input.title,
          description: input.description,
          type: input.type,
          targetValue: input.targetValue,
          currentValue: 0,
          unit: input.unit,
          startDate: input.startDate,
          endDate: input.endDate,
          status: "active",
        })
        .returning();

      const keyResult = result[0];
      if (!keyResult) {
        return err(new OkrRepoError("Failed to create key result"));
      }

      return validate(keyResultSchema, keyResult).mapErr((error) => {
        return new OkrRepoError("Invalid key result data", error);
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to create key result", error));
    }
  }

  async findKeyResultById(
    id: string,
  ): Promise<Result<KeyResult | null, OkrRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(keyResults)
        .where(eq(keyResults.id, id))
        .limit(1);

      const keyResult = result[0];
      if (!keyResult) {
        return ok(null);
      }

      return validate(keyResultSchema, keyResult).mapErr((error) => {
        return new OkrRepoError("Invalid key result data", error);
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to find key result", error));
    }
  }

  async findKeyResultWithProgress(
    id: string,
  ): Promise<Result<KeyResultWithProgress | null, OkrRepositoryError>> {
    try {
      const keyResultResult = await this.findKeyResultById(id);
      if (keyResultResult.isErr()) return err(keyResultResult.error);
      if (!keyResultResult.value) return ok(null);

      const keyResult = keyResultResult.value;
      const progressPercentage = this.calculateProgress(
        keyResult.currentValue,
        keyResult.targetValue,
        keyResult.type,
      );

      const keyResultWithProgress = {
        ...keyResult,
        progressPercentage,
      };

      return validate(
        keyResultWithProgressSchema,
        keyResultWithProgress,
      ).mapErr((error) => {
        return new OkrRepoError("Invalid key result with progress data", error);
      });
    } catch (error) {
      return err(
        new OkrRepoError("Failed to find key result with progress", error),
      );
    }
  }

  async updateKeyResult(
    params: UpdateKeyResultParams,
  ): Promise<Result<KeyResult, OkrRepositoryError>> {
    try {
      const updateData: Partial<typeof keyResults.$inferInsert> = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.type !== undefined) updateData.type = params.type;
      if (params.targetValue !== undefined)
        updateData.targetValue = params.targetValue;
      if (params.unit !== undefined) updateData.unit = params.unit;
      if (params.startDate !== undefined)
        updateData.startDate = params.startDate;
      if (params.endDate !== undefined) updateData.endDate = params.endDate;
      if (params.status !== undefined) updateData.status = params.status;

      if (Object.keys(updateData).length === 0) {
        const existingKeyResult = await this.findKeyResultById(params.id);
        if (existingKeyResult.isErr()) return err(existingKeyResult.error);
        if (!existingKeyResult.value) {
          return err(new OkrRepoError("Key result not found"));
        }
        return ok(existingKeyResult.value);
      }

      const result = await this.db
        .update(keyResults)
        .set(updateData)
        .where(eq(keyResults.id, params.id))
        .returning();

      const keyResult = result[0];
      if (!keyResult) {
        return err(new OkrRepoError("Key result not found"));
      }

      return validate(keyResultSchema, keyResult).mapErr((error) => {
        return new OkrRepoError("Invalid key result data", error);
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to update key result", error));
    }
  }

  async updateKeyResultProgress(
    params: UpdateKeyResultProgressParams,
  ): Promise<Result<KeyResult, OkrRepositoryError>> {
    try {
      const result = await this.db
        .update(keyResults)
        .set({ currentValue: params.currentValue })
        .where(eq(keyResults.id, params.id))
        .returning();

      const keyResult = result[0];
      if (!keyResult) {
        return err(new OkrRepoError("Key result not found"));
      }

      return validate(keyResultSchema, keyResult).mapErr((error) => {
        return new OkrRepoError("Invalid key result data", error);
      });
    } catch (error) {
      return err(
        new OkrRepoError("Failed to update key result progress", error),
      );
    }
  }

  async deleteKeyResult(id: string): Promise<Result<void, OkrRepositoryError>> {
    try {
      const result = await this.db
        .delete(keyResults)
        .where(eq(keyResults.id, id));

      if (result.rowsAffected === 0) {
        return err(new OkrRepoError("Key result not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new OkrRepoError("Failed to delete key result", error));
    }
  }

  async listKeyResults(
    query: ListKeyResultsQuery,
  ): Promise<
    Result<{ items: KeyResult[]; count: number }, OkrRepositoryError>
  > {
    try {
      const { pagination, filter, sort } = query;
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      const whereConditions = [];

      if (filter?.search) {
        whereConditions.push(
          or(
            like(keyResults.title, `%${filter.search}%`),
            like(keyResults.description, `%${filter.search}%`),
          ),
        );
      }

      if (filter?.objectiveId) {
        whereConditions.push(eq(keyResults.objectiveId, filter.objectiveId));
      }

      if (filter?.type) {
        whereConditions.push(eq(keyResults.type, filter.type));
      }

      if (filter?.status) {
        whereConditions.push(eq(keyResults.status, filter.status));
      }

      if (filter?.progressMin !== undefined) {
        whereConditions.push(
          sql`(CASE WHEN ${keyResults.type} = 'boolean' THEN 
                   CASE WHEN ${keyResults.currentValue} = ${keyResults.targetValue} THEN 100 ELSE 0 END
                 WHEN ${keyResults.type} = 'percentage' THEN ${keyResults.currentValue}
                 ELSE (${keyResults.currentValue} / ${keyResults.targetValue}) * 100 
                 END) >= ${filter.progressMin}`,
        );
      }

      if (filter?.progressMax !== undefined) {
        whereConditions.push(
          sql`(CASE WHEN ${keyResults.type} = 'boolean' THEN 
                   CASE WHEN ${keyResults.currentValue} = ${keyResults.targetValue} THEN 100 ELSE 0 END
                 WHEN ${keyResults.type} = 'percentage' THEN ${keyResults.currentValue}
                 ELSE (${keyResults.currentValue} / ${keyResults.targetValue}) * 100 
                 END) <= ${filter.progressMax}`,
        );
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const countResult = await this.db
        .select({ count: count() })
        .from(keyResults)
        .where(whereClause);

      const totalCount = countResult[0]?.count ?? 0;

      // Build order by clause
      let orderBy = sql`${keyResults.createdAt} desc`;
      if (sort?.field && sort?.direction) {
        const field = keyResults[sort.field as keyof typeof keyResults];
        if (field) {
          orderBy =
            sort.direction === "asc" ? sql`${field} asc` : sql`${field} desc`;
        }
      }

      // Get key results
      const keyResultsResult = await this.db
        .select()
        .from(keyResults)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const validatedKeyResults = [];
      for (const keyResult of keyResultsResult) {
        const validationResult = validate(keyResultSchema, keyResult);
        if (validationResult.isErr()) {
          return err(
            new OkrRepoError("Invalid key result data", validationResult.error),
          );
        }
        validatedKeyResults.push(validationResult.value);
      }

      return ok({
        items: validatedKeyResults,
        count: totalCount,
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to list key results", error));
    }
  }

  async listKeyResultsWithProgress(
    query: ListKeyResultsQuery,
  ): Promise<
    Result<
      { items: KeyResultWithProgress[]; count: number },
      OkrRepositoryError
    >
  > {
    try {
      const keyResultsResult = await this.listKeyResults(query);
      if (keyResultsResult.isErr()) return err(keyResultsResult.error);

      const keyResultsWithProgress = [];
      for (const keyResult of keyResultsResult.value.items) {
        const progressPercentage = this.calculateProgress(
          keyResult.currentValue,
          keyResult.targetValue,
          keyResult.type,
        );

        const keyResultWithProgress = {
          ...keyResult,
          progressPercentage,
        };

        const validationResult = validate(
          keyResultWithProgressSchema,
          keyResultWithProgress,
        );
        if (validationResult.isErr()) {
          return err(
            new OkrRepoError(
              "Invalid key result with progress data",
              validationResult.error,
            ),
          );
        }
        keyResultsWithProgress.push(validationResult.value);
      }

      return ok({
        items: keyResultsWithProgress,
        count: keyResultsResult.value.count,
      });
    } catch (error) {
      return err(
        new OkrRepoError("Failed to list key results with progress", error),
      );
    }
  }

  async listKeyResultsByObjective(
    objectiveId: string,
  ): Promise<Result<KeyResult[], OkrRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(keyResults)
        .where(eq(keyResults.objectiveId, objectiveId));

      const validatedKeyResults = [];
      for (const keyResult of result) {
        const validationResult = validate(keyResultSchema, keyResult);
        if (validationResult.isErr()) {
          return err(
            new OkrRepoError("Invalid key result data", validationResult.error),
          );
        }
        validatedKeyResults.push(validationResult.value);
      }

      return ok(validatedKeyResults);
    } catch (error) {
      return err(
        new OkrRepoError("Failed to list key results by objective", error),
      );
    }
  }

  async listKeyResultsWithProgressByObjective(
    objectiveId: string,
  ): Promise<Result<KeyResultWithProgress[], OkrRepositoryError>> {
    try {
      const keyResultsResult =
        await this.listKeyResultsByObjective(objectiveId);
      if (keyResultsResult.isErr()) return err(keyResultsResult.error);

      const keyResultsWithProgress = [];
      for (const keyResult of keyResultsResult.value) {
        const progressPercentage = this.calculateProgress(
          keyResult.currentValue,
          keyResult.targetValue,
          keyResult.type,
        );

        const keyResultWithProgress = {
          ...keyResult,
          progressPercentage,
        };

        const validationResult = validate(
          keyResultWithProgressSchema,
          keyResultWithProgress,
        );
        if (validationResult.isErr()) {
          return err(
            new OkrRepoError(
              "Invalid key result with progress data",
              validationResult.error,
            ),
          );
        }
        keyResultsWithProgress.push(validationResult.value);
      }

      return ok(keyResultsWithProgress);
    } catch (error) {
      return err(
        new OkrRepoError(
          "Failed to list key results with progress by objective",
          error,
        ),
      );
    }
  }

  // Dashboard and statistics
  async getDashboardStats(
    userId: string,
    teamId?: string,
  ): Promise<Result<OkrDashboardStats, OkrRepositoryError>> {
    try {
      const whereConditions = [eq(objectives.ownerId, userId)];

      if (teamId) {
        whereConditions.push(eq(objectives.teamId, teamId));
      }

      const whereClause = and(...whereConditions);

      // Get objective stats
      const objectiveStats = await this.db
        .select({
          total: count(),
          active: count(
            sql`CASE WHEN ${objectives.status} = 'active' THEN 1 END`,
          ),
          completed: count(
            sql`CASE WHEN ${objectives.status} = 'completed' THEN 1 END`,
          ),
        })
        .from(objectives)
        .where(whereClause);

      // Get key result stats
      const keyResultStats = await this.db
        .select({
          total: count(),
          completed: count(
            sql`CASE WHEN ${keyResults.status} = 'completed' THEN 1 END`,
          ),
          avgProgress: avg(
            sql`CASE WHEN ${keyResults.type} = 'boolean' THEN 
                     CASE WHEN ${keyResults.currentValue} = ${keyResults.targetValue} THEN 100 ELSE 0 END
                 WHEN ${keyResults.type} = 'percentage' THEN ${keyResults.currentValue}
                 ELSE (${keyResults.currentValue} / ${keyResults.targetValue}) * 100 
                 END`,
          ),
        })
        .from(keyResults)
        .innerJoin(objectives, eq(keyResults.objectiveId, objectives.id))
        .where(whereClause);

      // Calculate risk status - directly calculate progress conditions without subquery
      const progressCondition = sql`CASE WHEN ${keyResults.type} = 'boolean' THEN 
                                         CASE WHEN ${keyResults.currentValue} = ${keyResults.targetValue} THEN 100 ELSE 0 END
                                     WHEN ${keyResults.type} = 'percentage' THEN ${keyResults.currentValue}
                                     ELSE (${keyResults.currentValue} / ${keyResults.targetValue}) * 100 
                                     END`;

      const riskStats = await this.db
        .select({
          onTrack: count(
            sql`CASE WHEN (${progressCondition}) >= 70 THEN 1 END`,
          ),
          atRisk: count(
            sql`CASE WHEN (${progressCondition}) >= 30 AND (${progressCondition}) < 70 THEN 1 END`,
          ),
          behind: count(sql`CASE WHEN (${progressCondition}) < 30 THEN 1 END`),
        })
        .from(keyResults)
        .innerJoin(objectives, eq(keyResults.objectiveId, objectives.id))
        .where(whereClause);

      const stats = {
        totalObjectives: objectiveStats[0]?.total ?? 0,
        activeObjectives: objectiveStats[0]?.active ?? 0,
        completedObjectives: objectiveStats[0]?.completed ?? 0,
        totalKeyResults: keyResultStats[0]?.total ?? 0,
        completedKeyResults: keyResultStats[0]?.completed ?? 0,
        averageProgress: Math.round(
          Number(keyResultStats[0]?.avgProgress) || 0,
        ),
        onTrackCount: riskStats[0]?.onTrack ?? 0,
        atRiskCount: riskStats[0]?.atRisk ?? 0,
        behindCount: riskStats[0]?.behind ?? 0,
      };

      return validate(okrDashboardStatsSchema, stats).mapErr((error) => {
        return new OkrRepoError("Invalid dashboard stats data", error);
      });
    } catch (error) {
      return err(new OkrRepoError("Failed to get dashboard stats", error));
    }
  }

  async getObjectiveProgress(
    objectiveId: string,
  ): Promise<Result<number, OkrRepositoryError>> {
    try {
      const result = await this.db
        .select({
          avgProgress: avg(
            sql`CASE WHEN ${keyResults.type} = 'boolean' THEN 
                     CASE WHEN ${keyResults.currentValue} = ${keyResults.targetValue} THEN 100 ELSE 0 END
                 WHEN ${keyResults.type} = 'percentage' THEN ${keyResults.currentValue}
                 ELSE (${keyResults.currentValue} / ${keyResults.targetValue}) * 100 
                 END`,
          ),
        })
        .from(keyResults)
        .where(eq(keyResults.objectiveId, objectiveId));

      const progress = result[0]?.avgProgress ?? 0;
      return ok(Math.round(Number(progress) || 0));
    } catch (error) {
      return err(new OkrRepoError("Failed to get objective progress", error));
    }
  }

  // Ownership and access
  async isObjectiveOwner(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(objectives)
        .where(
          and(eq(objectives.id, objectiveId), eq(objectives.ownerId, userId)),
        );

      const isOwner = (result[0]?.count ?? 0) > 0;
      return ok(isOwner);
    } catch (error) {
      return err(
        new OkrRepoError("Failed to check objective ownership", error),
      );
    }
  }

  async canUserAccessObjective(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>> {
    try {
      // Check if user is owner
      const ownerResult = await this.isObjectiveOwner(objectiveId, userId);
      if (ownerResult.isErr()) return ownerResult;
      if (ownerResult.value) return ok(true);

      // Check if user is a member of the team (for team objectives)
      const result = await this.db
        .select({ count: count() })
        .from(objectives)
        .leftJoin(teamMembers, eq(objectives.teamId, teamMembers.teamId))
        .where(
          and(
            eq(objectives.id, objectiveId),
            or(
              eq(objectives.type, "organization"), // All users can access org objectives
              and(
                eq(objectives.type, "team"),
                eq(teamMembers.userId, userId),
                eq(teamMembers.status, "active"),
              ),
            ),
          ),
        );

      const canAccess = (result[0]?.count ?? 0) > 0;
      return ok(canAccess);
    } catch (error) {
      return err(new OkrRepoError("Failed to check objective access", error));
    }
  }

  async canUserEditObjective(
    objectiveId: string,
    userId: string,
  ): Promise<Result<boolean, OkrRepositoryError>> {
    try {
      // For now, only owners can edit objectives
      // This can be extended to include permission-based access control
      return this.isObjectiveOwner(objectiveId, userId);
    } catch (error) {
      return err(
        new OkrRepoError("Failed to check objective edit permission", error),
      );
    }
  }

  // Helper methods
  private calculateProgress(
    currentValue: number,
    targetValue: number,
    type: "percentage" | "number" | "boolean",
  ): number {
    switch (type) {
      case "boolean":
        return currentValue === targetValue ? 100 : 0;
      case "percentage":
        return Math.min(Math.max(currentValue, 0), 100);
      case "number":
        if (targetValue === 0) return 0;
        return Math.min(Math.max((currentValue / targetValue) * 100, 0), 100);
      default:
        return 0;
    }
  }
}
