import { ok, type Result } from "neverthrow";
import type {
  EmailService,
  EmailServiceError,
  EmailTemplate,
  EmailVerificationData,
  PasswordResetData,
  TeamInvitationData,
} from "@/core/domain/common/ports/emailService";

export class MockEmailService implements EmailService {
  private readonly isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";
  }

  async sendEmail(
    template: EmailTemplate,
  ): Promise<Result<void, EmailServiceError>> {
    this.logEmail("Generic Email", template);
    return ok(undefined);
  }

  async sendEmailVerification(
    to: string,
    data: EmailVerificationData,
  ): Promise<Result<void, EmailServiceError>> {
    const template: EmailTemplate = {
      to,
      subject: "Verify your email address",
      htmlContent: this.generateEmailVerificationHtml(data),
      textContent: this.generateEmailVerificationText(data),
    };

    this.logEmail("Email Verification", template);
    return ok(undefined);
  }

  async sendPasswordReset(
    to: string,
    data: PasswordResetData,
  ): Promise<Result<void, EmailServiceError>> {
    const template: EmailTemplate = {
      to,
      subject: "Reset your password",
      htmlContent: this.generatePasswordResetHtml(data),
      textContent: this.generatePasswordResetText(data),
    };

    this.logEmail("Password Reset", template);
    return ok(undefined);
  }

  async sendTeamInvitation(
    to: string,
    data: TeamInvitationData,
  ): Promise<Result<void, EmailServiceError>> {
    const template: EmailTemplate = {
      to,
      subject: `You've been invited to join ${data.teamName}`,
      htmlContent: this.generateTeamInvitationHtml(data),
      textContent: this.generateTeamInvitationText(data),
    };

    this.logEmail("Team Invitation", template);
    return ok(undefined);
  }

  private logEmail(type: string, template: EmailTemplate): void {
    if (this.isDevelopment) {
      console.log(`\n📧 [MOCK EMAIL SERVICE] ${type}`);
      console.log(`To: ${template.to}`);
      console.log(`Subject: ${template.subject}`);
      console.log("\n--- HTML Content ---");
      console.log(template.htmlContent);
      if (template.textContent) {
        console.log("\n--- Text Content ---");
        console.log(template.textContent);
      }
      console.log("\n--- End Email ---\n");
    }
  }

  private generateEmailVerificationHtml(data: EmailVerificationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your email address</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Verify your email address</h1>
    
    <p>Hi ${data.userName},</p>
    
    <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.verificationUrl}" 
         style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563eb;">${data.verificationUrl}</p>
    
    <p>This verification link will expire in 24 hours.</p>
    
    <p>If you didn't create an account, please ignore this email.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">
      Best regards,<br>
      The OKR Manager Team
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateEmailVerificationText(data: EmailVerificationData): string {
    return `
Verify your email address

Hi ${data.userName},

Thank you for signing up! Please verify your email address by visiting this link:

${data.verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account, please ignore this email.

Best regards,
The OKR Manager Team
    `.trim();
  }

  private generatePasswordResetHtml(data: PasswordResetData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Reset your password</h1>
    
    <p>Hi ${data.userName},</p>
    
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.resetUrl}" 
         style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #dc2626;">${data.resetUrl}</p>
    
    <p>This password reset link will expire in 1 hour.</p>
    
    <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">
      Best regards,<br>
      The OKR Manager Team
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private generatePasswordResetText(data: PasswordResetData): string {
    return `
Reset your password

Hi ${data.userName},

We received a request to reset your password. Visit this link to create a new password:

${data.resetUrl}

This password reset link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The OKR Manager Team
    `.trim();
  }

  private generateTeamInvitationHtml(data: TeamInvitationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>You've been invited to join ${data.teamName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Team Invitation</h1>
    
    <p>Hi there!</p>
    
    <p>${data.inviterName} has invited you to join the team <strong>${data.teamName}</strong> on OKR Manager.</p>
    
    <p>Click the button below to accept the invitation and join the team:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.invitationUrl}" 
         style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Accept Invitation
      </a>
    </div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #16a34a;">${data.invitationUrl}</p>
    
    <p>This invitation will expire in 7 days.</p>
    
    <p>If you don't want to join this team, you can safely ignore this email.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">
      Best regards,<br>
      The OKR Manager Team
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateTeamInvitationText(data: TeamInvitationData): string {
    return `
Team Invitation

Hi there!

${data.inviterName} has invited you to join the team "${data.teamName}" on OKR Manager.

Visit this link to accept the invitation and join the team:

${data.invitationUrl}

This invitation will expire in 7 days.

If you don't want to join this team, you can safely ignore this email.

Best regards,
The OKR Manager Team
    `.trim();
  }
}
