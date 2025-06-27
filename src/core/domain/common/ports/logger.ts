import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";

export class LoggerError extends AnyError {
  override readonly name = "LoggerError";
}

export interface Logger {
  info(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>>;
  warn(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>>;
  error(
    message: string,
    error: unknown,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>>;
  debug(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>>;
}
