"use server";

import { redirect } from "next/navigation";
import { z } from "zod/v4";
import {
  type AddTeamMemberInput,
  addTeamMember,
} from "@/core/application/team/addTeamMember";
import {
  type CreateTeamInput,
  createTeam,
} from "@/core/application/team/createTeam";
import { getTeam } from "@/core/application/team/getTeam";
import {
  type InviteToTeamInput,
  inviteToTeam,
} from "@/core/application/team/inviteToTeam";
import { listTeams } from "@/core/application/team/listTeams";
import {
  type RemoveTeamMemberInput,
  removeTeamMember,
} from "@/core/application/team/removeTeamMember";
import {
  type UpdateTeamInput,
  updateTeam,
} from "@/core/application/team/updateTeam";
import { requireAuth } from "@/lib/auth";
import type { FormState } from "@/lib/formState";
import { validate } from "@/lib/validation";
import { context } from "./context";

const createTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateTeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const inviteToTeamSchema = z.object({
  teamId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

const addTeamMemberSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

const removeTeamMemberSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function getTeamsData() {
  const user = await requireAuth();

  const result = await listTeams(context, {
    pagination: { page: 1, limit: 50, order: "desc", orderBy: "createdAt" },
    filter: { memberId: user.id },
  });

  if (result.isErr()) {
    throw new Error("Failed to fetch teams");
  }

  // Return the paginated result directly as it contains items array
  return result.value;
}

export async function getTeamData(teamId: string) {
  const user = await requireAuth();

  const result = await getTeam(context, { id: teamId, requesterId: user.id });

  if (result.isErr()) {
    throw new Error("Failed to fetch team");
  }

  const team = result.value;

  // Transform to view type with computed properties
  return {
    ...team,
    members: [], // TODO: Add team members fetching
    okrs: [], // TODO: Add team objectives fetching
    overallProgress: 0, // TODO: Calculate team overall progress
    activeOkrCount: 0, // TODO: Calculate active OKR count
    recentActivity: [], // TODO: Add recent activity
  };
}

export async function createTeamAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
  };

  const validation = validate(createTeamSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const result = await createTeam(context, {
    ...validation.value,
    createdById: user.id,
  });

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

export async function updateTeamAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
  };

  const validation = validate(updateTeamSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const result = await updateTeam(context, {
    ...validation.value,
    requesterId: user.id,
  });

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  // Pages will be refreshed by Next.js navigation
  // Page will be refreshed by Next.js navigation

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}

export async function inviteToTeamAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    teamId: formData.get("teamId"),
    email: formData.get("email"),
    role: formData.get("role") || "member",
  };

  const validation = validate(inviteToTeamSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  // Look up role ID by role name
  const roleResult = await context.roleRepository.findRoleByName(
    validation.value.role,
  );
  if (roleResult.isErr() || !roleResult.value) {
    return {
      input: rawData,
      error: roleResult.isErr()
        ? roleResult.error
        : new Error("Role not found"),
    };
  }

  const result = await inviteToTeam(context, {
    teamId: validation.value.teamId,
    email: validation.value.email,
    roleId: roleResult.value.id,
    requesterId: user.id,
  });

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  // Page will be refreshed by Next.js navigation

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}

export async function addTeamMemberAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    teamId: formData.get("teamId"),
    userId: formData.get("userId"),
    role: formData.get("role") || "member",
  };

  const validation = validate(addTeamMemberSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  // Look up role ID by role name
  const roleResult = await context.roleRepository.findRoleByName(
    validation.value.role,
  );
  if (roleResult.isErr() || !roleResult.value) {
    return {
      input: rawData,
      error: roleResult.isErr()
        ? roleResult.error
        : new Error("Role not found"),
    };
  }

  const result = await addTeamMember(context, {
    teamId: validation.value.teamId,
    userId: validation.value.userId,
    roleId: roleResult.value.id,
    requesterId: user.id,
  });

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  // Page will be refreshed by Next.js navigation

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}

export async function removeTeamMemberAction(
  teamId: string,
  userId: string,
): Promise<void> {
  const currentUser = await requireAuth();

  const result = await removeTeamMember(context, {
    teamId,
    userId,
    requesterId: currentUser.id,
  });

  if (result.isErr()) {
    throw new Error("Failed to remove team member");
  }

  // Page will be refreshed by Next.js navigation
}
