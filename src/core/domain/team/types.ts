import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Base team schema
export const teamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  createdById: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Team = z.infer<typeof teamSchema>;

// Create team input
export const createTeamInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

// Create team params
export const createTeamParamsSchema = createTeamInputSchema.extend({
  createdById: z.string().uuid(),
});

export type CreateTeamParams = z.infer<typeof createTeamParamsSchema>;

// Update team input
export const updateTeamInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamInputSchema>;

// Update team params
export const updateTeamParamsSchema = updateTeamInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateTeamParams = z.infer<typeof updateTeamParamsSchema>;

// List teams query
export const listTeamsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      search: z.string().optional(),
      userId: z.string().uuid().optional(), // Filter by user membership
    })
    .optional(),
});

export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;

// Team member schema
export const teamMemberSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  invitedById: z.string().uuid().optional(),
  invitedAt: z.date().optional(),
  joinedAt: z.date().optional(),
  status: z.enum(["invited", "active", "inactive"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

// Add team member input
export const addTeamMemberInputSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export type AddTeamMemberInput = z.infer<typeof addTeamMemberInputSchema>;

// Add team member params
export const addTeamMemberParamsSchema = addTeamMemberInputSchema.extend({
  teamId: z.string().uuid(),
  invitedById: z.string().uuid(),
});

export type AddTeamMemberParams = z.infer<typeof addTeamMemberParamsSchema>;

// Update team member input
export const updateTeamMemberInputSchema = z.object({
  roleId: z.string().uuid().optional(),
  status: z.enum(["invited", "active", "inactive"]).optional(),
});

export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberInputSchema>;

// Update team member params
export const updateTeamMemberParamsSchema = updateTeamMemberInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateTeamMemberParams = z.infer<
  typeof updateTeamMemberParamsSchema
>;

// Team invitation schema
export const teamInvitationSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  email: z.string().email(),
  roleId: z.string().uuid(),
  invitedById: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  status: z.enum(["pending", "accepted", "expired", "cancelled"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TeamInvitation = z.infer<typeof teamInvitationSchema>;

// Invite team member input
export const inviteTeamMemberInputSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberInputSchema>;

// Create team invitation params
export const createTeamInvitationParamsSchema =
  inviteTeamMemberInputSchema.extend({
    teamId: z.string().uuid(),
    invitedById: z.string().uuid(),
    token: z.string(),
    expiresAt: z.date(),
  });

export type CreateTeamInvitationParams = z.infer<
  typeof createTeamInvitationParamsSchema
>;

// Accept team invitation input
export const acceptTeamInvitationInputSchema = z.object({
  token: z.string(),
});

export type AcceptTeamInvitationInput = z.infer<
  typeof acceptTeamInvitationInputSchema
>;

// Team with member count
export const teamWithStatsSchema = teamSchema.extend({
  memberCount: z.number(),
  activeOkrCount: z.number(),
});

export type TeamWithStats = z.infer<typeof teamWithStatsSchema>;

// List team members query
export const listTeamMembersQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      status: z.enum(["invited", "active", "inactive"]).optional(),
      roleId: z.string().uuid().optional(),
    })
    .optional(),
});

export type ListTeamMembersQuery = z.infer<typeof listTeamMembersQuerySchema>;
