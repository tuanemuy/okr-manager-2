import { z } from "zod/v4";

// Login input
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Login result
export const loginResultSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    avatarUrl: z.string().url().optional(),
    emailVerified: z.boolean(),
  }),
  sessionToken: z.string(),
  expiresAt: z.date(),
});

export type LoginResult = z.infer<typeof loginResultSchema>;

// Register input
export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

// Register result
export const registerResultSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    emailVerified: z.boolean(),
  }),
  emailVerificationToken: z.string().optional(),
});

export type RegisterResult = z.infer<typeof registerResultSchema>;

// Session schema
export const sessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Session = z.infer<typeof sessionSchema>;

// Create session params
export const createSessionParamsSchema = z.object({
  userId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
});

export type CreateSessionParams = z.infer<typeof createSessionParamsSchema>;

// Verify session input
export const verifySessionInputSchema = z.object({
  token: z.string(),
});

export type VerifySessionInput = z.infer<typeof verifySessionInputSchema>;

// Session with user
export const sessionWithUserSchema = sessionSchema.extend({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    avatarUrl: z.string().url().optional(),
    emailVerified: z.boolean(),
  }),
});

export type SessionWithUser = z.infer<typeof sessionWithUserSchema>;

// Logout input
export const logoutInputSchema = z.object({
  token: z.string(),
});

export type LogoutInput = z.infer<typeof logoutInputSchema>;

// Refresh session input
export const refreshSessionInputSchema = z.object({
  token: z.string(),
});

export type RefreshSessionInput = z.infer<typeof refreshSessionInputSchema>;

// Refresh session result
export const refreshSessionResultSchema = z.object({
  sessionToken: z.string(),
  expiresAt: z.date(),
});

export type RefreshSessionResult = z.infer<typeof refreshSessionResultSchema>;

// Password verification input
export const verifyPasswordInputSchema = z.object({
  plainPassword: z.string(),
  hashedPassword: z.string(),
});

export type VerifyPasswordInput = z.infer<typeof verifyPasswordInputSchema>;

// Hash password input
export const hashPasswordInputSchema = z.object({
  plainPassword: z.string(),
});

export type HashPasswordInput = z.infer<typeof hashPasswordInputSchema>;

// Reset password token
export const resetPasswordTokenSchema = z.object({
  token: z.string().uuid(),
  userId: z.string().uuid(),
  expiresAt: z.date(),
});

export type ResetPasswordToken = z.infer<typeof resetPasswordTokenSchema>;

// Email verification token
export const emailVerificationTokenSchema = z.object({
  token: z.string().uuid(),
  userId: z.string().uuid(),
  expiresAt: z.date(),
});

export type EmailVerificationToken = z.infer<
  typeof emailVerificationTokenSchema
>;
