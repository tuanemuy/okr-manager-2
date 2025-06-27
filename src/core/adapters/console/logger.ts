import { ok, type Result } from "neverthrow";
import type { Logger, LoggerError } from "@/core/domain/common/ports/logger";

export class ConsoleLogger implements Logger {
  async info(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>> {
    console.info(`[INFO] ${message}`, meta ? meta : "");
    return ok(undefined);
  }

  async warn(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>> {
    console.warn(`[WARN] ${message}`, meta ? meta : "");
    return ok(undefined);
  }

  async error(
    message: string,
    error: unknown,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>> {
    console.error(`[ERROR] ${message}`, error, meta ? meta : "");
    return ok(undefined);
  }

  async debug(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>> {
    console.debug(`[DEBUG] ${message}`, meta ? meta : "");
    return ok(undefined);
  }
}
