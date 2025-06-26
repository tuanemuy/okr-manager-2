import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type { CreateSessionParams, Session, SessionWithUser } from "../types";

export class SessionRepositoryError extends AnyError {
  override readonly name = "SessionRepositoryError";
}

export interface SessionRepository {
  create(
    params: CreateSessionParams,
  ): Promise<Result<Session, SessionRepositoryError>>;

  findByToken(
    token: string,
  ): Promise<Result<Session | null, SessionRepositoryError>>;

  findByTokenWithUser(
    token: string,
  ): Promise<Result<SessionWithUser | null, SessionRepositoryError>>;

  findByUserId(
    userId: string,
  ): Promise<Result<Session[], SessionRepositoryError>>;

  update(
    id: string,
    params: { expiresAt: Date },
  ): Promise<Result<Session, SessionRepositoryError>>;

  delete(id: string): Promise<Result<void, SessionRepositoryError>>;

  deleteByToken(token: string): Promise<Result<void, SessionRepositoryError>>;

  deleteByUserId(userId: string): Promise<Result<void, SessionRepositoryError>>;

  deleteExpired(): Promise<Result<number, SessionRepositoryError>>;

  isValid(token: string): Promise<Result<boolean, SessionRepositoryError>>;
}
