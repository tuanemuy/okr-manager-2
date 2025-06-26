import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";

export class EmailServiceError extends AnyError {
  override readonly name = "EmailServiceError";
}

export interface EmailTemplate {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface EmailVerificationData {
  userName: string;
  verificationUrl: string;
}

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
}

export interface TeamInvitationData {
  inviterName: string;
  teamName: string;
  invitationUrl: string;
}

export interface EmailService {
  sendEmail(template: EmailTemplate): Promise<Result<void, EmailServiceError>>;

  sendEmailVerification(
    to: string,
    data: EmailVerificationData,
  ): Promise<Result<void, EmailServiceError>>;

  sendPasswordReset(
    to: string,
    data: PasswordResetData,
  ): Promise<Result<void, EmailServiceError>>;

  sendTeamInvitation(
    to: string,
    data: TeamInvitationData,
  ): Promise<Result<void, EmailServiceError>>;
}
