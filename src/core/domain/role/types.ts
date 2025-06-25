import { z } from "zod/v4";

// Base role schema
export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Role = z.infer<typeof roleSchema>;

// Create role input
export const createRoleInputSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleInputSchema>;

// Update role input
export const updateRoleInputSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleInputSchema>;

// Update role params
export const updateRoleParamsSchema = updateRoleInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateRoleParams = z.infer<typeof updateRoleParamsSchema>;

// Base permission schema
export const permissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Permission = z.infer<typeof permissionSchema>;

// Create permission input
export const createPermissionInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
});

export type CreatePermissionInput = z.infer<typeof createPermissionInputSchema>;

// Update permission input
export const updatePermissionInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(200).optional(),
});

export type UpdatePermissionInput = z.infer<typeof updatePermissionInputSchema>;

// Update permission params
export const updatePermissionParamsSchema = updatePermissionInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdatePermissionParams = z.infer<
  typeof updatePermissionParamsSchema
>;

// Role permission schema
export const rolePermissionSchema = z.object({
  roleId: z.string().uuid(),
  permissionId: z.string().uuid(),
});

export type RolePermission = z.infer<typeof rolePermissionSchema>;

// Role with permissions
export const roleWithPermissionsSchema = roleSchema.extend({
  permissions: z.array(permissionSchema),
});

export type RoleWithPermissions = z.infer<typeof roleWithPermissionsSchema>;

// Assign permissions to role input
export const assignPermissionsToRoleInputSchema = z.object({
  roleId: z.string().uuid(),
  permissionIds: z.array(z.string().uuid()),
});

export type AssignPermissionsToRoleInput = z.infer<
  typeof assignPermissionsToRoleInputSchema
>;

// Remove permissions from role input
export const removePermissionsFromRoleInputSchema = z.object({
  roleId: z.string().uuid(),
  permissionIds: z.array(z.string().uuid()),
});

export type RemovePermissionsFromRoleInput = z.infer<
  typeof removePermissionsFromRoleInputSchema
>;

// Predefined permission names (as constants for type safety)
export const PERMISSIONS = {
  // Team permissions
  TEAM_CREATE: "team:create",
  TEAM_VIEW: "team:view",
  TEAM_EDIT: "team:edit",
  TEAM_DELETE: "team:delete",

  // Team member permissions
  TEAM_MEMBER_INVITE: "team:member:invite",
  TEAM_MEMBER_VIEW: "team:member:view",
  TEAM_MEMBER_EDIT: "team:member:edit",
  TEAM_MEMBER_REMOVE: "team:member:remove",

  // OKR permissions
  OKR_CREATE: "okr:create",
  OKR_VIEW: "okr:view",
  OKR_EDIT: "okr:edit",
  OKR_DELETE: "okr:delete",

  // Key Result permissions
  KEY_RESULT_CREATE: "key_result:create",
  KEY_RESULT_VIEW: "key_result:view",
  KEY_RESULT_EDIT: "key_result:edit",
  KEY_RESULT_DELETE: "key_result:delete",
  KEY_RESULT_UPDATE_PROGRESS: "key_result:update_progress",

  // User permissions
  USER_VIEW: "user:view",
  USER_EDIT: "user:edit",
} as const;

// Predefined role names
export const ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;
