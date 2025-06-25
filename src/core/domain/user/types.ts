import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

// Base user schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// Create user input
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Create user params (internal, with hashed password)
export const createUserParamsSchema = z.object({
  email: z.string().email(),
  hashedPassword: z.string(),
  name: z.string().min(1).max(100),
  emailVerificationToken: z.string().optional(),
});

export type CreateUserParams = z.infer<typeof createUserParamsSchema>;

// Update user input
export const updateUserInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Update user params
export const updateUserParamsSchema = updateUserInputSchema.extend({
  id: z.string().uuid(),
});

export type UpdateUserParams = z.infer<typeof updateUserParamsSchema>;

// User profile (public view)
export const userProfileSchema = userSchema.omit({
  emailVerified: true,
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// List users query
export const listUsersQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      search: z.string().optional(),
      emailVerified: z.boolean().optional(),
    })
    .optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// Change password input
export const changePasswordInputSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(128),
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

// Email verification
export const emailVerificationSchema = z.object({
  token: z.string(),
});

export type EmailVerification = z.infer<typeof emailVerificationSchema>;

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;

// Password reset
export const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).max(128),
});

export type PasswordReset = z.infer<typeof passwordResetSchema>;
