"use server";

import { z } from "zod/v4";
import { listObjectives } from "@/core/application/okr/listObjectives";
import { addTeamMember } from "@/core/application/team/addTeamMember";
import { createTeam } from "@/core/application/team/createTeam";
import { getTeam } from "@/core/application/team/getTeam";
import { inviteToTeam } from "@/core/application/team/inviteToTeam";
import { listTeamMembers } from "@/core/application/team/listTeamMembers";
import { listTeams } from "@/core/application/team/listTeams";
import { removeTeamMember } from "@/core/application/team/removeTeamMember";
import { updateTeam } from "@/core/application/team/updateTeam";
import { getUser } from "@/core/application/user/getUser";
import type { ObjectiveWithKeyResults } from "@/core/domain/okr/types";
import type { Role } from "@/core/domain/role/types";
import type { Team, TeamMember } from "@/core/domain/team/types";
import type { User } from "@/core/domain/user/types";
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

type TeamWithStatsAndRole = Team & {
  memberCount: number;
  activeOkrCount: number;
  role: string;
  okrCount: number;
};

export async function getTeamsData() {
  const user = await requireAuth();

  const result = await listTeams(context, {
    pagination: { page: 1, limit: 50, order: "desc", orderBy: "createdAt" },
    filter: { memberId: user.id },
  });

  if (result.isErr()) {
    return { items: [], count: 0 };
  }

  // Get user's role in each team
  const teamsWithRoleResults = await Promise.all(
    result.value.items.map(async (team) => {
      const memberResult = await context.teamRepository.findMember(
        team.id,
        user.id,
      );

      if (memberResult.isErr() || !memberResult.value) {
        return null;
      }

      const roleResult = await context.roleRepository.findRoleById(
        memberResult.value.roleId,
      );

      if (roleResult.isErr() || !roleResult.value) {
        return null;
      }

      return {
        ...team,
        role: roleResult.value.name,
        okrCount: team.activeOkrCount, // Use activeOkrCount as okrCount
      } as TeamWithStatsAndRole;
    }),
  );

  // Filter out null results from failed team processing
  const teamsWithRole = teamsWithRoleResults.filter(
    (team): team is TeamWithStatsAndRole => team !== null,
  );

  return {
    items: teamsWithRole,
    count: result.value.count,
  };
}

type TeamMemberWithUserAndRole = TeamMember & {
  user: User;
  role: Role | null;
};

type TeamDetailView = Team & {
  members: TeamMemberWithUserAndRole[];
  okrs: ObjectiveWithKeyResults[];
  overallProgress: number;
  activeOkrCount: number;
  recentActivity: unknown[];
};

export async function getTeamData(
  teamId: string,
): Promise<TeamDetailView | null> {
  const user = await requireAuth();

  const result = await getTeam(context, { id: teamId, requesterId: user.id });

  if (result.isErr()) {
    return null;
  }

  const team = result.value;

  // Fetch team members
  const membersResult = await listTeamMembers(context, {
    teamId,
    requesterId: user.id,
    page: 1,
    limit: 100,
  });

  if (membersResult.isErr()) {
    return null;
  }

  // Enrich members with user and role data
  const membersWithDetailsResults = await Promise.all(
    membersResult.value.items.map(async (member) => {
      // Get user details
      const userResult = await getUser(context, { id: member.userId });
      if (userResult.isErr()) {
        return null;
      }

      // Get role details
      const roleResult = await context.roleRepository.findRoleById(
        member.roleId,
      );
      if (roleResult.isErr()) {
        return null;
      }

      return {
        ...member,
        user: userResult.value,
        role: roleResult.value,
      };
    }),
  );

  // Filter out null results from failed member processing
  const membersWithDetails = membersWithDetailsResults.filter(
    (member): member is TeamMemberWithUserAndRole => member !== null,
  );

  // Fetch team objectives
  const objectivesResult = await listObjectives(
    context,
    user.id,
    {
      pagination: { page: 1, limit: 100, order: "desc", orderBy: "createdAt" },
      filter: { teamId },
    },
    true, // include key results
  );

  if (objectivesResult.isErr()) {
    return null;
  }

  // Calculate overall progress
  const overallProgress =
    objectivesResult.value.items.length > 0
      ? objectivesResult.value.items.reduce(
          (sum, obj) => sum + (obj.progressPercentage ?? 0),
          0,
        ) / objectivesResult.value.items.length
      : 0;

  // Count active OKRs
  const activeOkrCount = objectivesResult.value.items.filter(
    (obj) => obj.status === "active",
  ).length;

  return {
    ...team,
    members: membersWithDetails,
    okrs: objectivesResult.value.items,
    overallProgress,
    activeOkrCount,
    recentActivity: [], // TODO: Add recent activity
  };
}

export async function createTeamAction(
  _prevState: FormState,
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
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await requireAuth();

  const result = await removeTeamMember(context, {
    teamId,
    userId,
    requesterId: currentUser.id,
  });

  if (result.isErr()) {
    return { success: false, error: "Failed to remove team member" };
  }

  // Page will be refreshed by Next.js navigation
  return { success: true };
}

export async function listTeamsAction(options?: {
  pagination?: {
    page: number;
    limit: number;
    order: "asc" | "desc";
    orderBy: "createdAt" | "updatedAt";
  };
  filter?: {
    search?: string;
    memberId?: string;
  };
}) {
  await requireAuth();

  const defaultOptions = {
    pagination: {
      page: 1,
      limit: 100,
      order: "desc" as const,
      orderBy: "createdAt",
    },
    filter: options?.filter,
  };

  const result = await listTeams(
    context,
    options ? { ...defaultOptions, ...options } : defaultOptions,
  );

  if (result.isErr()) {
    return { items: [], count: 0 };
  }

  return result.value;
}
