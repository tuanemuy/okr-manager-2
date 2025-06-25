import { and, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type {
  UserRepository,
  UserRepositoryError,
} from "@/core/domain/user/ports/userRepository";
import { UserRepositoryError as UserRepoError } from "@/core/domain/user/ports/userRepository";
import {
  type CreateUserParams,
  type ListUsersQuery,
  type UpdateUserParams,
  type User,
  type UserProfile,
  userProfileSchema,
  userSchema,
} from "@/core/domain/user/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { users } from "./schema";

export class DrizzleSqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateUserParams,
  ): Promise<Result<User, UserRepositoryError>> {
    try {
      const result = await this.db
        .insert(users)
        .values({
          email: params.email,
          hashedPassword: params.hashedPassword,
          name: params.name,
          emailVerificationToken: params.emailVerificationToken,
        })
        .returning();

      const user = result[0];
      if (!user) {
        return err(new UserRepoError("Failed to create user"));
      }

      return validate(userSchema, user).mapErr((error) => {
        return new UserRepoError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepoError("Failed to create user", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new UserRepoError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepoError("Failed to find user by id", error));
    }
  }

  async findByEmail(
    email: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new UserRepoError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepoError("Failed to find user by email", error));
    }
  }

  async findByEmailVerificationToken(
    token: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new UserRepoError("Invalid user data", error);
      });
    } catch (error) {
      return err(
        new UserRepoError(
          "Failed to find user by email verification token",
          error,
        ),
      );
    }
  }

  async findByPasswordResetToken(
    token: string,
  ): Promise<Result<User | null, UserRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.passwordResetToken, token),
            sql`${users.passwordResetExpiresAt} > datetime('now')`,
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new UserRepoError("Invalid user data", error);
      });
    } catch (error) {
      return err(
        new UserRepoError("Failed to find user by password reset token", error),
      );
    }
  }

  async update(
    params: UpdateUserParams,
  ): Promise<Result<User, UserRepositoryError>> {
    try {
      const updateData: Partial<typeof users.$inferInsert> = {};

      if (params.name !== undefined) {
        updateData.name = params.name;
      }
      if (params.avatarUrl !== undefined) {
        updateData.avatarUrl = params.avatarUrl;
      }

      const result = await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, params.id))
        .returning();

      if (result.length === 0) {
        return err(new UserRepoError("User not found"));
      }

      return validate(userSchema, result[0]).mapErr((error) => {
        return new UserRepoError("Invalid user data", error);
      });
    } catch (error) {
      return err(new UserRepoError("Failed to update user", error));
    }
  }

  async delete(id: string): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db.delete(users).where(eq(users.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new UserRepoError("Failed to delete user", error));
    }
  }

  async list(
    query: ListUsersQuery,
  ): Promise<
    Result<{ items: UserProfile[]; count: number }, UserRepositoryError>
  > {
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.search ? like(users.name, `%${filter.search}%`) : undefined,
      filter?.emailVerified !== undefined
        ? eq(users.emailVerified, filter.emailVerified)
        : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(filters.length > 0 ? and(...filters) : undefined)
          .limit(limit)
          .offset(offset),
        this.db
          .select({ count: sql`count(*)` })
          .from(users)
          .where(filters.length > 0 ? and(...filters) : undefined),
      ]);

      const validatedItems = items
        .map((item) => validate(userProfileSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok({
        items: validatedItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new UserRepoError("Failed to list users", error));
    }
  }

  async setEmailVerified(
    id: string,
    verified: boolean,
  ): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db
        .update(users)
        .set({
          emailVerified: verified,
          emailVerificationToken: verified ? null : undefined,
        })
        .where(eq(users.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new UserRepoError("Failed to set email verified status", error),
      );
    }
  }

  async setEmailVerificationToken(
    id: string,
    token: string | null,
  ): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db
        .update(users)
        .set({ emailVerificationToken: token })
        .where(eq(users.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new UserRepoError("Failed to set email verification token", error),
      );
    }
  }

  async setPasswordResetToken(
    id: string,
    token: string | null,
    expiresAt: Date | null,
  ): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db
        .update(users)
        .set({
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        })
        .where(eq(users.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new UserRepoError("Failed to set password reset token", error),
      );
    }
  }

  async changePassword(
    id: string,
    hashedPassword: string,
  ): Promise<Result<void, UserRepositoryError>> {
    try {
      await this.db
        .update(users)
        .set({
          hashedPassword,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        })
        .where(eq(users.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new UserRepoError("Failed to change password", error));
    }
  }
}
