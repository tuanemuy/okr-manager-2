import { and, eq, inArray, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type {
  RoleRepository,
  RoleRepositoryError,
} from "@/core/domain/role/ports/roleRepository";
import { RoleRepositoryError as RoleRepoError } from "@/core/domain/role/ports/roleRepository";
import type {
  AssignPermissionsToRoleInput,
  CreatePermissionInput,
  CreateRoleInput,
  Permission,
  RemovePermissionsFromRoleInput,
  Role,
  RoleWithPermissions,
  UpdatePermissionParams,
  UpdateRoleParams,
} from "@/core/domain/role/types";
import {
  permissionSchema,
  roleSchema,
  roleWithPermissionsSchema,
} from "@/core/domain/role/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { permissions, rolePermissions, roles, teamMembers } from "./schema";

export class DrizzleSqliteRoleRepository implements RoleRepository {
  constructor(private readonly db: Database) {}

  // Role operations
  async createRole(
    input: CreateRoleInput,
  ): Promise<Result<Role, RoleRepositoryError>> {
    try {
      const result = await this.db
        .insert(roles)
        .values({
          name: input.name,
          description: input.description,
        })
        .returning();

      const role = result[0];
      if (!role) {
        return err(new RoleRepoError("Failed to create role"));
      }

      return validate(roleSchema, role).mapErr((error) => {
        return new RoleRepoError("Invalid role data", error);
      });
    } catch (error) {
      return err(new RoleRepoError("Failed to create role", error));
    }
  }

  async findRoleById(
    id: string,
  ): Promise<Result<Role | null, RoleRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);

      const role = result[0];
      if (!role) {
        return ok(null);
      }

      return validate(roleSchema, role).mapErr((error) => {
        return new RoleRepoError("Invalid role data", error);
      });
    } catch (error) {
      return err(new RoleRepoError("Failed to find role", error));
    }
  }

  async findRoleByName(
    name: string,
  ): Promise<Result<Role | null, RoleRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);

      const role = result[0];
      if (!role) {
        return ok(null);
      }

      return validate(roleSchema, role).mapErr((error) => {
        return new RoleRepoError("Invalid role data", error);
      });
    } catch (error) {
      return err(new RoleRepoError("Failed to find role by name", error));
    }
  }

  async findRoleWithPermissions(
    id: string,
  ): Promise<Result<RoleWithPermissions | null, RoleRepositoryError>> {
    try {
      // Get the role
      const roleResult = await this.findRoleById(id);
      if (roleResult.isErr()) return err(roleResult.error);
      if (!roleResult.value) return ok(null);

      // Get permissions for this role
      const permissionsResult = await this.getRolePermissions(id);
      if (permissionsResult.isErr()) return err(permissionsResult.error);

      const roleWithPermissions = {
        ...roleResult.value,
        permissions: permissionsResult.value,
      };

      return validate(roleWithPermissionsSchema, roleWithPermissions).mapErr(
        (error) => {
          return new RoleRepoError("Invalid role with permissions data", error);
        },
      );
    } catch (error) {
      return err(
        new RoleRepoError("Failed to find role with permissions", error),
      );
    }
  }

  async updateRole(
    params: UpdateRoleParams,
  ): Promise<Result<Role, RoleRepositoryError>> {
    try {
      const updateData: Partial<typeof roles.$inferInsert> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;

      if (Object.keys(updateData).length === 0) {
        const existingRole = await this.findRoleById(params.id);
        if (existingRole.isErr()) return err(existingRole.error);
        if (!existingRole.value) {
          return err(new RoleRepoError("Role not found"));
        }
        return ok(existingRole.value);
      }

      const result = await this.db
        .update(roles)
        .set(updateData)
        .where(eq(roles.id, params.id))
        .returning();

      const role = result[0];
      if (!role) {
        return err(new RoleRepoError("Role not found"));
      }

      return validate(roleSchema, role).mapErr((error) => {
        return new RoleRepoError("Invalid role data", error);
      });
    } catch (error) {
      return err(new RoleRepoError("Failed to update role", error));
    }
  }

  async deleteRole(id: string): Promise<Result<void, RoleRepositoryError>> {
    try {
      const result = await this.db.delete(roles).where(eq(roles.id, id));

      if (result.rowsAffected === 0) {
        return err(new RoleRepoError("Role not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RoleRepoError("Failed to delete role", error));
    }
  }

  async listRoles(): Promise<Result<Role[], RoleRepositoryError>> {
    try {
      const result = await this.db.select().from(roles);

      const validatedRoles = [];
      for (const role of result) {
        const validationResult = validate(roleSchema, role);
        if (validationResult.isErr()) {
          return err(
            new RoleRepoError("Invalid role data", validationResult.error),
          );
        }
        validatedRoles.push(validationResult.value);
      }

      return ok(validatedRoles);
    } catch (error) {
      return err(new RoleRepoError("Failed to list roles", error));
    }
  }

  async listRolesWithPermissions(): Promise<
    Result<RoleWithPermissions[], RoleRepositoryError>
  > {
    try {
      const rolesResult = await this.listRoles();
      if (rolesResult.isErr()) return err(rolesResult.error);

      const rolesWithPermissions = [];
      for (const role of rolesResult.value) {
        const permissionsResult = await this.getRolePermissions(role.id);
        if (permissionsResult.isErr()) return err(permissionsResult.error);

        const roleWithPermissions = {
          ...role,
          permissions: permissionsResult.value,
        };

        const validationResult = validate(
          roleWithPermissionsSchema,
          roleWithPermissions,
        );
        if (validationResult.isErr()) {
          return err(
            new RoleRepoError(
              "Invalid role with permissions data",
              validationResult.error,
            ),
          );
        }
        rolesWithPermissions.push(validationResult.value);
      }

      return ok(rolesWithPermissions);
    } catch (error) {
      return err(
        new RoleRepoError("Failed to list roles with permissions", error),
      );
    }
  }

  // Permission operations
  async createPermission(
    input: CreatePermissionInput,
  ): Promise<Result<Permission, RoleRepositoryError>> {
    try {
      const result = await this.db
        .insert(permissions)
        .values({
          name: input.name,
          description: input.description,
        })
        .returning();

      const permission = result[0];
      if (!permission) {
        return err(new RoleRepoError("Failed to create permission"));
      }

      return validate(permissionSchema, permission).mapErr((error) => {
        return new RoleRepoError("Invalid permission data", error);
      });
    } catch (error) {
      return err(new RoleRepoError("Failed to create permission", error));
    }
  }

  async findPermissionById(
    id: string,
  ): Promise<Result<Permission | null, RoleRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(permissions)
        .where(eq(permissions.id, id))
        .limit(1);

      const permission = result[0];
      if (!permission) {
        return ok(null);
      }

      return validate(permissionSchema, permission).mapErr((error) => {
        return new RoleRepoError("Invalid permission data", error);
      });
    } catch (error) {
      return err(new RoleRepoError("Failed to find permission", error));
    }
  }

  async findPermissionByName(
    name: string,
  ): Promise<Result<Permission | null, RoleRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(permissions)
        .where(eq(permissions.name, name))
        .limit(1);

      const permission = result[0];
      if (!permission) {
        return ok(null);
      }

      return validate(permissionSchema, permission).mapErr((error) => {
        return new RoleRepoError("Invalid permission data", error);
      });
    } catch (error) {
      return err(new RoleRepoError("Failed to find permission by name", error));
    }
  }

  async updatePermission(
    params: UpdatePermissionParams,
  ): Promise<Result<Permission, RoleRepositoryError>> {
    try {
      const updateData: Partial<typeof permissions.$inferInsert> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;

      if (Object.keys(updateData).length === 0) {
        const existingPermission = await this.findPermissionById(params.id);
        if (existingPermission.isErr()) return err(existingPermission.error);
        if (!existingPermission.value) {
          return err(new RoleRepoError("Permission not found"));
        }
        return ok(existingPermission.value);
      }

      const result = await this.db
        .update(permissions)
        .set(updateData)
        .where(eq(permissions.id, params.id))
        .returning();

      const permission = result[0];
      if (!permission) {
        return err(new RoleRepoError("Permission not found"));
      }

      return validate(permissionSchema, permission).mapErr((error) => {
        return new RoleRepoError("Invalid permission data", error);
      });
    } catch (error) {
      return err(new RoleRepoError("Failed to update permission", error));
    }
  }

  async deletePermission(
    id: string,
  ): Promise<Result<void, RoleRepositoryError>> {
    try {
      const result = await this.db
        .delete(permissions)
        .where(eq(permissions.id, id));

      if (result.rowsAffected === 0) {
        return err(new RoleRepoError("Permission not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RoleRepoError("Failed to delete permission", error));
    }
  }

  async listPermissions(): Promise<Result<Permission[], RoleRepositoryError>> {
    try {
      const result = await this.db.select().from(permissions);

      const validatedPermissions = [];
      for (const permission of result) {
        const validationResult = validate(permissionSchema, permission);
        if (validationResult.isErr()) {
          return err(
            new RoleRepoError(
              "Invalid permission data",
              validationResult.error,
            ),
          );
        }
        validatedPermissions.push(validationResult.value);
      }

      return ok(validatedPermissions);
    } catch (error) {
      return err(new RoleRepoError("Failed to list permissions", error));
    }
  }

  // Role-Permission associations
  async assignPermissionsToRole(
    input: AssignPermissionsToRoleInput,
  ): Promise<Result<void, RoleRepositoryError>> {
    try {
      if (input.permissionIds.length === 0) {
        return ok(undefined);
      }

      const values = input.permissionIds.map((permissionId) => ({
        roleId: input.roleId,
        permissionId,
      }));

      await this.db
        .insert(rolePermissions)
        .values(values)
        .onConflictDoNothing();

      return ok(undefined);
    } catch (error) {
      return err(
        new RoleRepoError("Failed to assign permissions to role", error),
      );
    }
  }

  async removePermissionsFromRole(
    input: RemovePermissionsFromRoleInput,
  ): Promise<Result<void, RoleRepositoryError>> {
    try {
      if (input.permissionIds.length === 0) {
        return ok(undefined);
      }

      await this.db
        .delete(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, input.roleId),
            inArray(rolePermissions.permissionId, input.permissionIds),
          ),
        );

      return ok(undefined);
    } catch (error) {
      return err(
        new RoleRepoError("Failed to remove permissions from role", error),
      );
    }
  }

  async getRolePermissions(
    roleId: string,
  ): Promise<Result<Permission[], RoleRepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          createdAt: permissions.createdAt,
          updatedAt: permissions.updatedAt,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(eq(rolePermissions.roleId, roleId));

      const validatedPermissions = [];
      for (const permission of result) {
        const validationResult = validate(permissionSchema, permission);
        if (validationResult.isErr()) {
          return err(
            new RoleRepoError(
              "Invalid permission data",
              validationResult.error,
            ),
          );
        }
        validatedPermissions.push(validationResult.value);
      }

      return ok(validatedPermissions);
    } catch (error) {
      return err(new RoleRepoError("Failed to get role permissions", error));
    }
  }

  // Utility methods
  async hasPermission(
    roleId: string,
    permissionName: string,
  ): Promise<Result<boolean, RoleRepositoryError>> {
    try {
      const result = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(permissions.name, permissionName),
          ),
        );

      const count = result[0]?.count ?? 0;
      return ok(count > 0);
    } catch (error) {
      return err(new RoleRepoError("Failed to check permission", error));
    }
  }

  async getUserPermissions(
    userId: string,
    teamId?: string,
  ): Promise<Result<Permission[], RoleRepositoryError>> {
    try {
      const whereConditions = [
        eq(teamMembers.userId, userId),
        eq(teamMembers.status, "active"),
      ];

      if (teamId) {
        whereConditions.push(eq(teamMembers.teamId, teamId));
      }

      const query = this.db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          createdAt: permissions.createdAt,
          updatedAt: permissions.updatedAt,
        })
        .from(teamMembers)
        .innerJoin(roles, eq(teamMembers.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(and(...whereConditions));

      const result = await query;

      const uniquePermissions = new Map<string, Permission>();

      for (const permission of result) {
        const validationResult = validate(permissionSchema, permission);
        if (validationResult.isErr()) {
          return err(
            new RoleRepoError(
              "Invalid permission data",
              validationResult.error,
            ),
          );
        }
        uniquePermissions.set(permission.id, validationResult.value);
      }

      return ok(Array.from(uniquePermissions.values()));
    } catch (error) {
      return err(new RoleRepoError("Failed to get user permissions", error));
    }
  }
}
