import { ok, type Result } from "neverthrow";
import type { Logger, LoggerError } from "@/core/domain/common/ports/logger";

export class MockLogger implements Logger {
  public logs: Array<{
    level: "info" | "warn" | "error" | "debug";
    message: string;
    error?: unknown;
    meta?: Record<string, unknown>;
  }> = [];

  async info(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>> {
    this.logs.push({ level: "info", message, meta });
    return ok(undefined);
  }

  async warn(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>> {
    this.logs.push({ level: "warn", message, meta });
    return ok(undefined);
  }

  async error(
    message: string,
    error: unknown,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>> {
    this.logs.push({ level: "error", message, error, meta });
    return ok(undefined);
  }

  async debug(
    message: string,
    meta?: Record<string, unknown>,
  ): Promise<Result<void, LoggerError>> {
    this.logs.push({ level: "debug", message, meta });
    return ok(undefined);
  }

  clear(): void {
    this.logs = [];
  }

  getLastLog() {
    return this.logs[this.logs.length - 1];
  }

  getErrorLogs() {
    return this.logs.filter((log) => log.level === "error");
  }
}
