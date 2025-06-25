import { and, eq, lt, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type {
  SessionRepository,
  SessionRepositoryError,
} from "@/core/domain/auth/ports/sessionRepository";
import { SessionRepositoryError as SessionRepoError } from "@/core/domain/auth/ports/sessionRepository";
import {
  type CreateSessionParams,
  type Session,
  type SessionWithUser,
  sessionSchema,
  sessionWithUserSchema,
} from "@/core/domain/auth/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { sessions, users } from "./schema";

export class DrizzleSqliteSessionRepository implements SessionRepository {
  constructor(private readonly db: Database) {}

  async create(
    params: CreateSessionParams,
  ): Promise<Result<Session, SessionRepositoryError>> {
    try {
      const result = await this.db
        .insert(sessions)
        .values({
          userId: params.userId,
          token: params.token,
          expiresAt: params.expiresAt,
        })
        .returning();

      const session = result[0];
      if (!session) {
        return err(new SessionRepoError("Failed to create session"));
      }

      return validate(sessionSchema, session).mapErr((error) => {
        return new SessionRepoError("Invalid session data", error);
      });
    } catch (error) {
      return err(new SessionRepoError("Failed to create session", error));
    }
  }

  async findByToken(
    token: string,
  ): Promise<Result<Session | null, SessionRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(sessionSchema, result[0]).mapErr((error) => {
        return new SessionRepoError("Invalid session data", error);
      });
    } catch (error) {
      return err(
        new SessionRepoError("Failed to find session by token", error),
      );
    }
  }

  async findByTokenWithUser(
    token: string,
  ): Promise<Result<SessionWithUser | null, SessionRepositoryError>> {
    try {
      const result = await this.db
        .select({
          id: sessions.id,
          userId: sessions.userId,
          token: sessions.token,
          expiresAt: sessions.expiresAt,
          createdAt: sessions.createdAt,
          updatedAt: sessions.updatedAt,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
            emailVerified: users.emailVerified,
          },
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.token, token))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(sessionWithUserSchema, result[0]).mapErr((error) => {
        return new SessionRepoError("Invalid session with user data", error);
      });
    } catch (error) {
      return err(
        new SessionRepoError(
          "Failed to find session by token with user",
          error,
        ),
      );
    }
  }

  async findByUserId(
    userId: string,
  ): Promise<Result<Session[], SessionRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId));

      const validatedSessions = result
        .map((session) => validate(sessionSchema, session).unwrapOr(null))
        .filter((session) => session !== null);

      return ok(validatedSessions);
    } catch (error) {
      return err(
        new SessionRepoError("Failed to find sessions by user id", error),
      );
    }
  }

  async update(
    id: string,
    params: { expiresAt: Date },
  ): Promise<Result<Session, SessionRepositoryError>> {
    try {
      const result = await this.db
        .update(sessions)
        .set({ expiresAt: params.expiresAt })
        .where(eq(sessions.id, id))
        .returning();

      if (result.length === 0) {
        return err(new SessionRepoError("Session not found"));
      }

      return validate(sessionSchema, result[0]).mapErr((error) => {
        return new SessionRepoError("Invalid session data", error);
      });
    } catch (error) {
      return err(new SessionRepoError("Failed to update session", error));
    }
  }

  async delete(id: string): Promise<Result<void, SessionRepositoryError>> {
    try {
      await this.db.delete(sessions).where(eq(sessions.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new SessionRepoError("Failed to delete session", error));
    }
  }

  async deleteByToken(
    token: string,
  ): Promise<Result<void, SessionRepositoryError>> {
    try {
      await this.db.delete(sessions).where(eq(sessions.token, token));

      return ok(undefined);
    } catch (error) {
      return err(
        new SessionRepoError("Failed to delete session by token", error),
      );
    }
  }

  async deleteByUserId(
    userId: string,
  ): Promise<Result<void, SessionRepositoryError>> {
    try {
      await this.db.delete(sessions).where(eq(sessions.userId, userId));

      return ok(undefined);
    } catch (error) {
      return err(
        new SessionRepoError("Failed to delete sessions by user id", error),
      );
    }
  }

  async deleteExpired(): Promise<Result<number, SessionRepositoryError>> {
    try {
      await this.db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

      return ok(1); // Return dummy count since LibSQL doesn't provide changes
    } catch (error) {
      return err(
        new SessionRepoError("Failed to delete expired sessions", error),
      );
    }
  }

  async isValid(
    token: string,
  ): Promise<Result<boolean, SessionRepositoryError>> {
    try {
      const result = await this.db
        .select({ count: sql`count(*)` })
        .from(sessions)
        .where(
          and(
            eq(sessions.token, token),
            sql`${sessions.expiresAt} > datetime('now')`,
          ),
        );

      const count = Number(result[0]?.count || 0);
      return ok(count > 0);
    } catch (error) {
      return err(new SessionRepoError("Failed to validate session", error));
    }
  }
}
