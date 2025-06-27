import { z } from "zod/v4";
import { BcryptPasswordHasher } from "@/core/adapters/bcrypt/passwordHasher";
import { ConsoleLogger } from "@/core/adapters/console/logger";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { DrizzleSqliteOkrRepository } from "@/core/adapters/drizzleSqlite/okrRepository";
import { DrizzleSqliteRoleRepository } from "@/core/adapters/drizzleSqlite/roleRepository";
import { DrizzleSqliteSessionRepository } from "@/core/adapters/drizzleSqlite/sessionRepository";
import { DrizzleSqliteTeamRepository } from "@/core/adapters/drizzleSqlite/teamRepository";
import { DrizzleSqliteUserRepository } from "@/core/adapters/drizzleSqlite/userRepository";
import { MockEmailService } from "@/core/adapters/mock/emailService";
import type { Context } from "@/core/application/context";

export const envSchema = z.object({
  NEXT_PUBLIC_URL: z.string().url(),
  SQLITE_FILE_PATH: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.safeParse(process.env);
if (!env.success) {
  const errors = env.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Environment validation failed: ${errors}`);
}

const db = getDatabase(env.data.SQLITE_FILE_PATH);

export const context: Context = {
  publicUrl: env.data.NEXT_PUBLIC_URL,
  userRepository: new DrizzleSqliteUserRepository(db),
  sessionRepository: new DrizzleSqliteSessionRepository(db),
  teamRepository: new DrizzleSqliteTeamRepository(db),
  roleRepository: new DrizzleSqliteRoleRepository(db),
  okrRepository: new DrizzleSqliteOkrRepository(db),
  passwordHasher: new BcryptPasswordHasher(),
  emailService: new MockEmailService(),
  logger: new ConsoleLogger(),
};
