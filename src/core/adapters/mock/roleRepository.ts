import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import {
  type RoleRepository,
  RoleRepositoryError,
} from "@/core/domain/role/ports/roleRepository";
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

export class MockRoleRepository implements RoleRepository {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private rolePermissions: Map<string, Set<string>> = new Map();
  private roleNameIndex: Map<string, string> = new Map();
  private permissionNameIndex: Map<string, string> = new Map();
  private userPermissions: Map<string, Set<string>> = new Map();

  async createRole(
    input: CreateRoleInput,
  ): Promise<Result<Role, RoleRepositoryError>> {
    if (this.roleNameIndex.has(input.name)) {
      return err(new RoleRepositoryError("Role name already exists"));
    }

    const id = uuidv7();
    const now = new Date();
    const role: Role = {
      id,
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    this.roles.set(id, role);
    this.roleNameIndex.set(input.name, id);
    this.rolePermissions.set(id, new Set());

    return ok(role);
  }

  async findRoleById(
    id: string,
  ): Promise<Result<Role | null, RoleRepositoryError>> {
    const role = this.roles.get(id);
    return ok(role || null);
  }

  async findRoleByName(
    name: string,
  ): Promise<Result<Role | null, RoleRepositoryError>> {
    const roleId = this.roleNameIndex.get(name);
    if (!roleId) {
      return ok(null);
    }
    return this.findRoleById(roleId);
  }

  async findRoleWithPermissions(
    id: string,
  ): Promise<Result<RoleWithPermissions | null, RoleRepositoryError>> {
    const role = this.roles.get(id);
    if (!role) {
      return ok(null);
    }

    const permissionIds = this.rolePermissions.get(id) || new Set();
    const permissions = Array.from(permissionIds)
      .map((permId) => this.permissions.get(permId))
      .filter((perm): perm is Permission => perm !== undefined);

    const roleWithPermissions: RoleWithPermissions = {
      ...role,
      permissions,
    };

    return ok(roleWithPermissions);
  }

  async updateRole(
    params: UpdateRoleParams,
  ): Promise<Result<Role, RoleRepositoryError>> {
    const role = this.roles.get(params.id);
    if (!role) {
      return err(new RoleRepositoryError("Role not found"));
    }

    // Check if name already exists (excluding current role)
    if (params.name && this.roleNameIndex.has(params.name)) {
      const existingRoleId = this.roleNameIndex.get(params.name);
      if (existingRoleId !== params.id) {
        return err(new RoleRepositoryError("Role name already exists"));
      }
    }

    const updatedRole: Role = {
      ...role,
      name: params.name ?? role.name,
      description: params.description ?? role.description,
      updatedAt: new Date(),
    };

    // Update name index if name changed
    if (params.name && params.name !== role.name) {
      this.roleNameIndex.delete(role.name);
      this.roleNameIndex.set(params.name, params.id);
    }

    this.roles.set(params.id, updatedRole);
    return ok(updatedRole);
  }

  async deleteRole(id: string): Promise<Result<void, RoleRepositoryError>> {
    const role = this.roles.get(id);
    if (!role) {
      return err(new RoleRepositoryError("Role not found"));
    }

    this.roles.delete(id);
    this.roleNameIndex.delete(role.name);
    this.rolePermissions.delete(id);

    return ok(undefined);
  }

  async listRoles(): Promise<Result<Role[], RoleRepositoryError>> {
    const roles = Array.from(this.roles.values());
    return ok(roles);
  }

  async listRolesWithPermissions(): Promise<
    Result<RoleWithPermissions[], RoleRepositoryError>
  > {
    const roles = Array.from(this.roles.values());
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const result = await this.findRoleWithPermissions(role.id);
        return result.isOk() && result.value ? result.value : null;
      }),
    );

    return ok(rolesWithPermissions.filter(Boolean) as RoleWithPermissions[]);
  }

  async createPermission(
    input: CreatePermissionInput,
  ): Promise<Result<Permission, RoleRepositoryError>> {
    if (this.permissionNameIndex.has(input.name)) {
      return err(new RoleRepositoryError("Permission name already exists"));
    }

    const id = uuidv7();
    const now = new Date();
    const permission: Permission = {
      id,
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    this.permissions.set(id, permission);
    this.permissionNameIndex.set(input.name, id);

    return ok(permission);
  }

  async findPermissionById(
    id: string,
  ): Promise<Result<Permission | null, RoleRepositoryError>> {
    const permission = this.permissions.get(id);
    return ok(permission || null);
  }

  async findPermissionByName(
    name: string,
  ): Promise<Result<Permission | null, RoleRepositoryError>> {
    const permissionId = this.permissionNameIndex.get(name);
    if (!permissionId) {
      return ok(null);
    }
    return this.findPermissionById(permissionId);
  }

  async updatePermission(
    params: UpdatePermissionParams,
  ): Promise<Result<Permission, RoleRepositoryError>> {
    const permission = this.permissions.get(params.id);
    if (!permission) {
      return err(new RoleRepositoryError("Permission not found"));
    }

    // Check if name already exists (excluding current permission)
    if (params.name && this.permissionNameIndex.has(params.name)) {
      const existingPermissionId = this.permissionNameIndex.get(params.name);
      if (existingPermissionId !== params.id) {
        return err(new RoleRepositoryError("Permission name already exists"));
      }
    }

    const updatedPermission: Permission = {
      ...permission,
      name: params.name ?? permission.name,
      description: params.description ?? permission.description,
      updatedAt: new Date(),
    };

    // Update name index if name changed
    if (params.name && params.name !== permission.name) {
      this.permissionNameIndex.delete(permission.name);
      this.permissionNameIndex.set(params.name, params.id);
    }

    this.permissions.set(params.id, updatedPermission);
    return ok(updatedPermission);
  }

  async deletePermission(
    id: string,
  ): Promise<Result<void, RoleRepositoryError>> {
    const permission = this.permissions.get(id);
    if (!permission) {
      return err(new RoleRepositoryError("Permission not found"));
    }

    // Remove from all roles
    for (const rolePermissions of this.rolePermissions.values()) {
      rolePermissions.delete(id);
    }

    this.permissions.delete(id);
    this.permissionNameIndex.delete(permission.name);

    return ok(undefined);
  }

  async listPermissions(): Promise<Result<Permission[], RoleRepositoryError>> {
    const permissions = Array.from(this.permissions.values());
    return ok(permissions);
  }

  async assignPermissionsToRole(
    input: AssignPermissionsToRoleInput,
  ): Promise<Result<void, RoleRepositoryError>> {
    if (!this.roles.has(input.roleId)) {
      return err(new RoleRepositoryError("Role not found"));
    }

    const rolePermissions = this.rolePermissions.get(input.roleId) || new Set();

    for (const permissionId of input.permissionIds) {
      if (!this.permissions.has(permissionId)) {
        return err(
          new RoleRepositoryError(`Permission not found: ${permissionId}`),
        );
      }
      rolePermissions.add(permissionId);
    }

    this.rolePermissions.set(input.roleId, rolePermissions);
    return ok(undefined);
  }

  async removePermissionsFromRole(
    input: RemovePermissionsFromRoleInput,
  ): Promise<Result<void, RoleRepositoryError>> {
    if (!this.roles.has(input.roleId)) {
      return err(new RoleRepositoryError("Role not found"));
    }

    const rolePermissions = this.rolePermissions.get(input.roleId) || new Set();

    for (const permissionId of input.permissionIds) {
      rolePermissions.delete(permissionId);
    }

    this.rolePermissions.set(input.roleId, rolePermissions);
    return ok(undefined);
  }

  async getRolePermissions(
    roleId: string,
  ): Promise<Result<Permission[], RoleRepositoryError>> {
    if (!this.roles.has(roleId)) {
      return err(new RoleRepositoryError("Role not found"));
    }

    const permissionIds = this.rolePermissions.get(roleId) || new Set();
    const permissions = Array.from(permissionIds)
      .map((permId) => this.permissions.get(permId))
      .filter((perm): perm is Permission => perm !== undefined);

    return ok(permissions);
  }

  async hasPermission(
    roleId: string,
    permissionName: string,
  ): Promise<Result<boolean, RoleRepositoryError>> {
    const permissionId = this.permissionNameIndex.get(permissionName);
    if (!permissionId) {
      return ok(false);
    }

    const rolePermissions = this.rolePermissions.get(roleId) || new Set();
    return ok(rolePermissions.has(permissionId));
  }

  async getUserPermissions(
    userId: string,
    _teamId?: string,
  ): Promise<Result<Permission[], RoleRepositoryError>> {
    const permissionIds = this.userPermissions.get(userId) || new Set();
    const permissions = Array.from(permissionIds)
      .map((permId) => this.permissions.get(permId))
      .filter((perm): perm is Permission => perm !== undefined);

    return ok(permissions);
  }

  // Helper methods for testing
  clear(): void {
    this.roles.clear();
    this.permissions.clear();
    this.rolePermissions.clear();
    this.roleNameIndex.clear();
    this.permissionNameIndex.clear();
    this.userPermissions.clear();
  }

  seedRoles(roles: Role[]): void {
    for (const role of roles) {
      this.roles.set(role.id, role);
      this.roleNameIndex.set(role.name, role.id);
      if (!this.rolePermissions.has(role.id)) {
        this.rolePermissions.set(role.id, new Set());
      }
    }
  }

  seedPermissions(permissions: Permission[]): void {
    for (const permission of permissions) {
      this.permissions.set(permission.id, permission);
      this.permissionNameIndex.set(permission.name, permission.id);
    }
  }

  assignPermissionToUser(userId: string, permissionId: string): void {
    const userPermissions = this.userPermissions.get(userId) || new Set();
    userPermissions.add(permissionId);
    this.userPermissions.set(userId, userPermissions);
  }

  assignPermissionsByNameToUser(
    userId: string,
    permissionNames: string[],
  ): void {
    const userPermissions = this.userPermissions.get(userId) || new Set();
    for (const permissionName of permissionNames) {
      const permissionId = this.permissionNameIndex.get(permissionName);
      if (permissionId) {
        userPermissions.add(permissionId);
      }
    }
    this.userPermissions.set(userId, userPermissions);
  }
}
