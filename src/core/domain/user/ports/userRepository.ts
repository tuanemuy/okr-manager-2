import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type {
  CreateUserParams,
  ListUsersQuery,
  UpdateUserParams,
  User,
  UserProfile,
  UserWithAuth,
} from "../types";

export class UserRepositoryError extends AnyError {
  override readonly name = "UserRepositoryError";
}

export interface UserRepository {
  create(params: CreateUserParams): Promise<Result<User, UserRepositoryError>>;

  findById(id: string): Promise<Result<User | null, UserRepositoryError>>;

  findByEmail(email: string): Promise<Result<User | null, UserRepositoryError>>;

  findByEmailForAuth(
    email: string,
  ): Promise<Result<UserWithAuth | null, UserRepositoryError>>;

  findByEmailVerificationToken(
    token: string,
  ): Promise<Result<User | null, UserRepositoryError>>;

  findByPasswordResetToken(
    token: string,
  ): Promise<Result<User | null, UserRepositoryError>>;

  update(params: UpdateUserParams): Promise<Result<User, UserRepositoryError>>;

  delete(id: string): Promise<Result<void, UserRepositoryError>>;

  list(
    query: ListUsersQuery,
  ): Promise<
    Result<{ items: UserProfile[]; count: number }, UserRepositoryError>
  >;

  setEmailVerified(
    id: string,
    verified: boolean,
  ): Promise<Result<void, UserRepositoryError>>;

  setEmailVerificationToken(
    id: string,
    token: string | null,
  ): Promise<Result<void, UserRepositoryError>>;

  setPasswordResetToken(
    id: string,
    token: string | null,
    expiresAt: Date | null,
  ): Promise<Result<void, UserRepositoryError>>;

  changePassword(
    id: string,
    hashedPassword: string,
  ): Promise<Result<void, UserRepositoryError>>;
}
