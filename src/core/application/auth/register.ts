import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import type { Context } from "../context";

export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";
}

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export async function register(
  context: Context,
  input: RegisterInput,
): Promise<Result<User, ApplicationError>> {
  // Check if user already exists
  const existingUserResult = await context.userRepository.findByEmail(
    input.email,
  );
  if (existingUserResult.isErr()) {
    await context.logger.error(
      "Failed to check existing user",
      existingUserResult.error,
      { email: input.email },
    );
    return err(
      new ApplicationError(
        "Failed to check existing user",
        existingUserResult.error,
      ),
    );
  }

  if (existingUserResult.value !== null) {
    return err(new ApplicationError("User already exists with this email"));
  }

  // Hash password
  const hashedPasswordResult = await context.passwordHasher.hash(
    input.password,
  );
  if (hashedPasswordResult.isErr()) {
    await context.logger.error(
      "Failed to hash password",
      hashedPasswordResult.error,
      { email: input.email },
    );
    return err(
      new ApplicationError(
        "Failed to hash password",
        hashedPasswordResult.error,
      ),
    );
  }

  // Create user
  const createUserResult = await context.userRepository.create({
    email: input.email,
    hashedPassword: hashedPasswordResult.value,
    name: input.name,
  });

  if (createUserResult.isErr()) {
    await context.logger.error(
      "Failed to create user",
      createUserResult.error,
      { email: input.email },
    );
    return err(
      new ApplicationError("Failed to create user", createUserResult.error),
    );
  }

  // Send verification email
  const emailResult = await context.emailService.sendEmailVerification(
    input.email,
    {
      userName: input.name,
      verificationUrl: `${context.publicUrl}/verify-email?token=placeholder`, // TODO: Generate actual token
    },
  );

  if (emailResult.isErr()) {
    // Log error but don't fail registration
    await context.logger.error(
      "Failed to send verification email",
      emailResult.error,
      { email: input.email },
    );
  }

  return ok(createUserResult.value);
}
