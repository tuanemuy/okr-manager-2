import type { PasswordHasher } from "@/core/domain/auth/ports/passwordHasher";
import type { SessionRepository } from "@/core/domain/auth/ports/sessionRepository";
import type { EmailService } from "@/core/domain/common/ports/emailService";
import type { Logger } from "@/core/domain/common/ports/logger";
import type { OkrRepository } from "@/core/domain/okr/ports/okrRepository";
import type { RoleRepository } from "@/core/domain/role/ports/roleRepository";
import type { TeamRepository } from "@/core/domain/team/ports/teamRepository";
import type { UserRepository } from "@/core/domain/user/ports/userRepository";

export interface Context {
  publicUrl: string;
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
  passwordHasher: PasswordHasher;
  teamRepository: TeamRepository;
  roleRepository: RoleRepository;
  okrRepository: OkrRepository;
  emailService: EmailService;
  logger: Logger;
}
