"use server";

import { z } from "zod/v4";
import { createKeyResult } from "@/core/application/okr/createKeyResult";
import { createObjective } from "@/core/application/okr/createObjective";
import { getObjective } from "@/core/application/okr/getObjective";
import { updateKeyResult } from "@/core/application/okr/updateKeyResult";
import { requireAuth } from "@/lib/auth";
import type { FormState } from "@/lib/formState";
import { validate } from "@/lib/validation";
import { context } from "./context";

const createObjectiveSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["personal", "team", "organization"]),
  teamId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string(),
});

const createKeyResultSchema = z.object({
  objectiveId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["percentage", "number", "boolean"]),
  targetValue: z.number(),
  unit: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
});

const updateKeyResultSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
});

export async function getObjectiveData(objectiveId: string) {
  const user = await requireAuth();

  const result = await getObjective(context, user.id, objectiveId);

  if (result.isErr()) {
    throw new Error("Failed to fetch objective");
  }

  const objective = result.value;

  // Transform to view type with computed properties
  return {
    ...objective,
    progress: objective.progressPercentage || 0,
    keyResults: objective.keyResults.map((kr) => ({
      ...kr,
      progress: (kr.currentValue / kr.targetValue) * 100 || 0,
    })),
  };
}

export async function createObjectiveAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    teamId: formData.get("teamId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  };

  const validation = validate(createObjectiveSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const objectiveInput = {
    ...validation.value,
    startDate: new Date(validation.value.startDate),
    endDate: new Date(validation.value.endDate),
  };

  const result = await createObjective(context, user.id, objectiveInput);

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  // Pages will be refreshed by Next.js navigation

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}

export async function createKeyResultAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    objectiveId: formData.get("objectiveId"),
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    targetValue: Number(formData.get("targetValue")),
    unit: formData.get("unit"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  };

  const validation = validate(createKeyResultSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const keyResultInput = {
    ...validation.value,
    startDate: new Date(validation.value.startDate),
    endDate: new Date(validation.value.endDate),
  };

  const result = await createKeyResult(context, user.id, keyResultInput);

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  // Pages will be refreshed by Next.js navigation

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}

export async function updateKeyResultAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    targetValue: formData.get("targetValue")
      ? Number(formData.get("targetValue"))
      : undefined,
    currentValue: formData.get("currentValue")
      ? Number(formData.get("currentValue"))
      : undefined,
    unit: formData.get("unit"),
  };

  const validation = validate(updateKeyResultSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const { id, ...updateData } = validation.value;
  const result = await updateKeyResult(context, user.id, id, updateData);

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  // Pages will be refreshed by Next.js navigation

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}
