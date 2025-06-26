import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import {
  type UserRepository,
  UserRepositoryError,
} from "@/core/domain/user/ports/userRepository";
import type {
  CreateUserParams,
  ListUsersQuery,
  UpdateUserParams,
  User,
  UserProfile,
  UserWithAuth,
} from "@/core/domain/user/types";

export class MockUserRepository implements UserRepository {
  private users: Map<string, UserWithAuth> = new Map();
  private emailIndex: Map<string, string> = new Map();

  async create(
    params: CreateUserParams,
  ): Promise<Result<User, UserRepositoryError>> {
    // Check if email already exists
    if (this.emailIndex.has(params.email)) {
      return err(new UserRepositoryError("Email already exists"));
    }

    const id = uuidv7();
    const now = new Date();
    const userWithAuth: UserWithAuth = {
      id,
      email: params.email,
      name: params.name,
      hashedPassword: params.hashedPassword,
      avatarUrl: undefined,
      emailVerified: false,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, userWithAuth);
    this.emailIndex.set(params.email, id);

    const user: User = {
      id: userWithAuth.id,
      email: userWithAuth.email,
      name: userWithAuth.name,
      avatarUrl: userWithAuth.avatarUrl,
      emailVerified: userWithAuth.emailVerified,
      createdAt: userWithAuth.createdAt,
      updatedAt: userWithAuth.updatedAt,
    };

    return ok(user);
  }

  async findById(
    id: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    const userWithAuth = this.users.get(id);
    if (!userWithAuth) {
      return ok(null);
    }

    const user: User = {
      id: userWithAuth.id,
      email: userWithAuth.email,
      name: userWithAuth.name,
      avatarUrl: userWithAuth.avatarUrl,
      emailVerified: userWithAuth.emailVerified,
      createdAt: userWithAuth.createdAt,
      updatedAt: userWithAuth.updatedAt,
    };

    return ok(user);
  }

  async findByEmail(
    email: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    const userId = this.emailIndex.get(email);
    if (!userId) {
      return ok(null);
    }

    return this.findById(userId);
  }

  async findByEmailForAuth(
    email: string,
  ): Promise<Result<UserWithAuth | null, UserRepositoryError>> {
    const userId = this.emailIndex.get(email);
    if (!userId) {
      return ok(null);
    }

    const userWithAuth = this.users.get(userId);
    return ok(userWithAuth || null);
  }

  async findByEmailVerificationToken(
    _token: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    // In a real implementation, this would query by email verification token
    // For mock, we'll just return null
    return ok(null);
  }

  async findByPasswordResetToken(
    token: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    for (const user of this.users.values()) {
      if (user.passwordResetToken === token) {
        const userResult: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        return ok(userResult);
      }
    }
    return ok(null);
  }

  async update(
    params: UpdateUserParams,
  ): Promise<Result<User, UserRepositoryError>> {
    const userWithAuth = this.users.get(params.id);
    if (!userWithAuth) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUserWithAuth: UserWithAuth = {
      ...userWithAuth,
      name: params.name ?? userWithAuth.name,
      avatarUrl:
        params.avatarUrl !== undefined
          ? params.avatarUrl
          : userWithAuth.avatarUrl,
      updatedAt: new Date(),
    };

    this.users.set(params.id, updatedUserWithAuth);

    const user: User = {
      id: updatedUserWithAuth.id,
      email: updatedUserWithAuth.email,
      name: updatedUserWithAuth.name,
      avatarUrl: updatedUserWithAuth.avatarUrl,
      emailVerified: updatedUserWithAuth.emailVerified,
      createdAt: updatedUserWithAuth.createdAt,
      updatedAt: updatedUserWithAuth.updatedAt,
    };

    return ok(user);
  }

  async delete(id: string): Promise<Result<void, UserRepositoryError>> {
    const userWithAuth = this.users.get(id);
    if (!userWithAuth) {
      return err(new UserRepositoryError("User not found"));
    }

    this.users.delete(id);
    this.emailIndex.delete(userWithAuth.email);

    return ok(undefined);
  }

  async list(
    query: ListUsersQuery,
  ): Promise<
    Result<{ items: UserProfile[]; count: number }, UserRepositoryError>
  > {
    const allUsers = Array.from(this.users.values());

    // Apply filters
    let filteredUsers = allUsers;
    if (query.filter?.emailVerified !== undefined) {
      filteredUsers = filteredUsers.filter(
        (user) => user.emailVerified === query.filter?.emailVerified,
      );
    }
    if (query.filter?.search) {
      const searchTerm = query.filter.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm),
      );
    }

    // Apply pagination
    const startIndex = (query.pagination.page - 1) * query.pagination.limit;
    const endIndex = startIndex + query.pagination.limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Convert to UserProfile
    const userProfiles: UserProfile[] = paginatedUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return ok({
      items: userProfiles,
      count: filteredUsers.length,
    });
  }

  async setEmailVerified(
    id: string,
    verified: boolean,
  ): Promise<Result<void, UserRepositoryError>> {
    const userWithAuth = this.users.get(id);
    if (!userWithAuth) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: UserWithAuth = {
      ...userWithAuth,
      emailVerified: verified,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(undefined);
  }

  async setEmailVerificationToken(
    id: string,
    _token: string | null,
  ): Promise<Result<void, UserRepositoryError>> {
    const userWithAuth = this.users.get(id);
    if (!userWithAuth) {
      return err(new UserRepositoryError("User not found"));
    }

    // In a real implementation, this would store the email verification token
    // For mock, we'll just return success
    return ok(undefined);
  }

  async setPasswordResetToken(
    id: string,
    token: string | null,
    expiresAt: Date | null,
  ): Promise<Result<void, UserRepositoryError>> {
    const userWithAuth = this.users.get(id);
    if (!userWithAuth) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: UserWithAuth = {
      ...userWithAuth,
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(undefined);
  }

  async changePassword(
    id: string,
    hashedPassword: string,
  ): Promise<Result<void, UserRepositoryError>> {
    const userWithAuth = this.users.get(id);
    if (!userWithAuth) {
      return err(new UserRepositoryError("User not found"));
    }

    const updatedUser: UserWithAuth = {
      ...userWithAuth,
      hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return ok(undefined);
  }

  // Helper methods for testing
  clear(): void {
    this.users.clear();
    this.emailIndex.clear();
  }

  seed(users: UserWithAuth[]): void {
    for (const user of users) {
      this.users.set(user.id, user);
      this.emailIndex.set(user.email, user.id);
    }
  }
}
