import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Base objective schema
export const objectiveSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["personal", "team", "organization"]),
  ownerId: z.string().uuid(),
  teamId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["draft", "active", "completed", "cancelled"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Objective = z.infer<typeof objectiveSchema>;

// Create objective input
export const createObjectiveInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["personal", "team", "organization"]),
  teamId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  startDate: z.date(),
  endDate: z.date(),
});

export type CreateObjectiveInput = z.infer<typeof createObjectiveInputSchema>;

// Create objective params
export const createObjectiveParamsSchema = createObjectiveInputSchema.extend({
  ownerId: z.string().uuid(),
});

export type CreateObjectiveParams = z.infer<typeof createObjectiveParamsSchema>;

// Update objective input
export const updateObjectiveInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(["personal", "team", "organization"]).optional(),
  teamId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
});

export type UpdateObjectiveInput = z.infer<typeof updateObjectiveInputSchema>;

// Update objective params
export const updateObjectiveParamsSchema = updateObjectiveInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateObjectiveParams = z.infer<typeof updateObjectiveParamsSchema>;

// Base key result schema
export const keyResultSchema = z.object({
  id: z.string().uuid(),
  objectiveId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(["percentage", "number", "boolean"]),
  targetValue: z.number(),
  currentValue: z.number(),
  unit: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["active", "completed", "cancelled"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type KeyResult = z.infer<typeof keyResultSchema>;

// Create key result input
export const createKeyResultInputSchema = z.object({
  objectiveId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["percentage", "number", "boolean"]),
  targetValue: z.number(),
  unit: z.string().max(20).optional(),
  startDate: z.date(),
  endDate: z.date(),
});

export type CreateKeyResultInput = z.infer<typeof createKeyResultInputSchema>;

// Update key result input
export const updateKeyResultInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(["percentage", "number", "boolean"]).optional(),
  targetValue: z.number().optional(),
  unit: z.string().max(20).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional(),
});

export type UpdateKeyResultInput = z.infer<typeof updateKeyResultInputSchema>;

// Update key result params
export const updateKeyResultParamsSchema = updateKeyResultInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateKeyResultParams = z.infer<typeof updateKeyResultParamsSchema>;

// Update key result progress input
export const updateKeyResultProgressInputSchema = z.object({
  currentValue: z.number().min(0),
});

export type UpdateKeyResultProgressInput = z.infer<
  typeof updateKeyResultProgressInputSchema
>;

// Update key result progress params
export const updateKeyResultProgressParamsSchema =
  updateKeyResultProgressInputSchema.extend({
    id: z.string().uuid(),
  });

export type UpdateKeyResultProgressParams = z.infer<
  typeof updateKeyResultProgressParamsSchema
>;

// List objectives query
export const listObjectivesQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      search: z.string().optional(),
      type: z.enum(["personal", "team", "organization"]).optional(),
      status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
      ownerId: z.string().uuid().optional(),
      teamId: z.string().uuid().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(["title", "startDate", "endDate", "createdAt", "updatedAt"])
        .optional(),
      direction: z.enum(["asc", "desc"]).optional(),
    })
    .optional(),
});

export type ListObjectivesQuery = z.infer<typeof listObjectivesQuerySchema>;

// List key results query
export const listKeyResultsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      search: z.string().optional(),
      objectiveId: z.string().uuid().optional(),
      type: z.enum(["percentage", "number", "boolean"]).optional(),
      status: z.enum(["active", "completed", "cancelled"]).optional(),
      progressMin: z.number().optional(),
      progressMax: z.number().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum([
          "title",
          "currentValue",
          "targetValue",
          "startDate",
          "endDate",
          "createdAt",
          "updatedAt",
        ])
        .optional(),
      direction: z.enum(["asc", "desc"]).optional(),
    })
    .optional(),
});

export type ListKeyResultsQuery = z.infer<typeof listKeyResultsQuerySchema>;

// Objective with key results and progress
export const objectiveWithKeyResultsSchema = objectiveSchema.extend({
  keyResults: z.array(keyResultSchema),
  progressPercentage: z.number().min(0).max(100),
});

export type ObjectiveWithKeyResults = z.infer<
  typeof objectiveWithKeyResultsSchema
>;

// Key result with progress percentage (for percentage-based KRs)
export const keyResultWithProgressSchema = keyResultSchema.extend({
  progressPercentage: z.number().min(0).max(100),
});

export type KeyResultWithProgress = z.infer<typeof keyResultWithProgressSchema>;

// OKR dashboard stats
export const okrDashboardStatsSchema = z.object({
  totalObjectives: z.number(),
  activeObjectives: z.number(),
  completedObjectives: z.number(),
  totalKeyResults: z.number(),
  completedKeyResults: z.number(),
  averageProgress: z.number().min(0).max(100),
  onTrackCount: z.number(),
  atRiskCount: z.number(),
  behindCount: z.number(),
});

export type OkrDashboardStats = z.infer<typeof okrDashboardStatsSchema>;

// OKR period types
export const okrPeriodSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  name: z.string(), // e.g., "Q1 2024", "2024"
});

export type OkrPeriod = z.infer<typeof okrPeriodSchema>;
