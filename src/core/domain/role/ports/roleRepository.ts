import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
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
} from "../types";

export class RoleRepositoryError extends AnyError {
  override readonly name = "RoleRepositoryError";
}

export interface RoleRepository {
  // Role operations
  createRole(
    input: CreateRoleInput,
  ): Promise<Result<Role, RoleRepositoryError>>;

  findRoleById(id: string): Promise<Result<Role | null, RoleRepositoryError>>;

  findRoleByName(
    name: string,
  ): Promise<Result<Role | null, RoleRepositoryError>>;

  findRoleWithPermissions(
    id: string,
  ): Promise<Result<RoleWithPermissions | null, RoleRepositoryError>>;

  updateRole(
    params: UpdateRoleParams,
  ): Promise<Result<Role, RoleRepositoryError>>;

  deleteRole(id: string): Promise<Result<void, RoleRepositoryError>>;

  listRoles(): Promise<Result<Role[], RoleRepositoryError>>;

  listRolesWithPermissions(): Promise<
    Result<RoleWithPermissions[], RoleRepositoryError>
  >;

  // Permission operations
  createPermission(
    input: CreatePermissionInput,
  ): Promise<Result<Permission, RoleRepositoryError>>;

  findPermissionById(
    id: string,
  ): Promise<Result<Permission | null, RoleRepositoryError>>;

  findPermissionByName(
    name: string,
  ): Promise<Result<Permission | null, RoleRepositoryError>>;

  updatePermission(
    params: UpdatePermissionParams,
  ): Promise<Result<Permission, RoleRepositoryError>>;

  deletePermission(id: string): Promise<Result<void, RoleRepositoryError>>;

  listPermissions(): Promise<Result<Permission[], RoleRepositoryError>>;

  // Role-Permission associations
  assignPermissionsToRole(
    input: AssignPermissionsToRoleInput,
  ): Promise<Result<void, RoleRepositoryError>>;

  removePermissionsFromRole(
    input: RemovePermissionsFromRoleInput,
  ): Promise<Result<void, RoleRepositoryError>>;

  getRolePermissions(
    roleId: string,
  ): Promise<Result<Permission[], RoleRepositoryError>>;

  // Utility methods
  hasPermission(
    roleId: string,
    permissionName: string,
  ): Promise<Result<boolean, RoleRepositoryError>>;

  getUserPermissions(
    userId: string,
    teamId?: string,
  ): Promise<Result<Permission[], RoleRepositoryError>>;
}
