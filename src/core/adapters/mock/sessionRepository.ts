import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import {
  type SessionRepository,
  SessionRepositoryError,
} from "@/core/domain/auth/ports/sessionRepository";
import type {
  CreateSessionParams,
  Session,
  SessionWithUser,
} from "@/core/domain/auth/types";
import type { User } from "@/core/domain/user/types";

export class MockSessionRepository implements SessionRepository {
  private sessions: Map<string, Session> = new Map();
  private tokenIndex: Map<string, string> = new Map();
  private userSessions: Map<string, string[]> = new Map();

  // Mock user data for testing - in real tests, this would be injected or mocked separately
  private mockUsers: Map<string, User> = new Map();

  async create(
    params: CreateSessionParams,
  ): Promise<Result<Session, SessionRepositoryError>> {
    const id = uuidv7();
    const now = new Date();

    const session: Session = {
      id,
      userId: params.userId,
      token: params.token,
      expiresAt: params.expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, session);
    this.tokenIndex.set(params.token, id);

    // Add to user sessions index
    const userSessions = this.userSessions.get(params.userId) || [];
    userSessions.push(id);
    this.userSessions.set(params.userId, userSessions);

    return ok(session);
  }

  async findByToken(
    token: string,
  ): Promise<Result<Session | null, SessionRepositoryError>> {
    const sessionId = this.tokenIndex.get(token);
    if (!sessionId) {
      return ok(null);
    }

    const session = this.sessions.get(sessionId);
    return ok(session || null);
  }

  async findByTokenWithUser(
    token: string,
  ): Promise<Result<SessionWithUser | null, SessionRepositoryError>> {
    const sessionId = this.tokenIndex.get(token);
    if (!sessionId) {
      return ok(null);
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return ok(null);
    }

    const user = this.mockUsers.get(session.userId);
    if (!user) {
      return err(new SessionRepositoryError("User not found for session"));
    }

    const sessionWithUser: SessionWithUser = {
      ...session,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? undefined,
        emailVerified: user.emailVerified,
      },
    };

    return ok(sessionWithUser);
  }

  async findByUserId(
    userId: string,
  ): Promise<Result<Session[], SessionRepositoryError>> {
    const sessionIds = this.userSessions.get(userId) || [];
    const sessions = sessionIds
      .map((id) => this.sessions.get(id))
      .filter((session): session is Session => session !== undefined);

    return ok(sessions);
  }

  async update(
    id: string,
    params: { expiresAt: Date },
  ): Promise<Result<Session, SessionRepositoryError>> {
    const session = this.sessions.get(id);
    if (!session) {
      return err(new SessionRepositoryError("Session not found"));
    }

    const updatedSession: Session = {
      ...session,
      expiresAt: params.expiresAt,
      updatedAt: new Date(),
    };

    this.sessions.set(id, updatedSession);
    return ok(updatedSession);
  }

  async delete(id: string): Promise<Result<void, SessionRepositoryError>> {
    const session = this.sessions.get(id);
    if (!session) {
      return err(new SessionRepositoryError("Session not found"));
    }

    this.sessions.delete(id);
    this.tokenIndex.delete(session.token);

    // Remove from user sessions index
    const userSessions = this.userSessions.get(session.userId) || [];
    const updatedUserSessions = userSessions.filter(
      (sessionId) => sessionId !== id,
    );
    if (updatedUserSessions.length === 0) {
      this.userSessions.delete(session.userId);
    } else {
      this.userSessions.set(session.userId, updatedUserSessions);
    }

    return ok(undefined);
  }

  async deleteByToken(
    token: string,
  ): Promise<Result<void, SessionRepositoryError>> {
    const sessionId = this.tokenIndex.get(token);
    if (!sessionId) {
      return ok(undefined); // Already deleted or never existed
    }

    return this.delete(sessionId);
  }

  async deleteByUserId(
    userId: string,
  ): Promise<Result<void, SessionRepositoryError>> {
    const sessionIds = this.userSessions.get(userId) || [];

    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session) {
        this.sessions.delete(sessionId);
        this.tokenIndex.delete(session.token);
      }
    }

    this.userSessions.delete(userId);
    return ok(undefined);
  }

  async deleteExpired(): Promise<Result<number, SessionRepositoryError>> {
    const now = new Date();
    let deletedCount = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        await this.delete(id);
        deletedCount++;
      }
    }

    return ok(deletedCount);
  }

  async isValid(
    token: string,
  ): Promise<Result<boolean, SessionRepositoryError>> {
    const sessionResult = await this.findByToken(token);
    if (sessionResult.isErr()) {
      return err(sessionResult.error);
    }

    const session = sessionResult.value;
    if (!session) {
      return ok(false);
    }

    const now = new Date();
    return ok(session.expiresAt > now);
  }

  // Helper methods for testing
  clear(): void {
    this.sessions.clear();
    this.tokenIndex.clear();
    this.userSessions.clear();
    this.mockUsers.clear();
  }

  seedUsers(users: User[]): void {
    for (const user of users) {
      this.mockUsers.set(user.id, user);
    }
  }

  seedSessions(sessions: Session[]): void {
    for (const session of sessions) {
      this.sessions.set(session.id, session);
      this.tokenIndex.set(session.token, session.id);

      const userSessions = this.userSessions.get(session.userId) || [];
      userSessions.push(session.id);
      this.userSessions.set(session.userId, userSessions);
    }
  }
}
