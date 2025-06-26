"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod/v4";
import { login } from "@/core/application/auth/login";
import { logout } from "@/core/application/auth/logout";
import { register } from "@/core/application/auth/register";
import { requestPasswordReset } from "@/core/application/auth/requestPasswordReset";
import { validateSession } from "@/core/application/auth/validateSession";
import type { User } from "@/core/domain/user/types";
import type { FormState } from "@/lib/formState";
import { validate } from "@/lib/validation";
import { context } from "./context";

const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const passwordResetInputSchema = z.object({
  email: z.string().email(),
});

export async function loginAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = validate(loginInputSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const result = await login(context, validation.value);

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  const cookieStore = await cookies();
  cookieStore.set("sessionToken", result.value.session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect("/");
}

export async function registerAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = validate(registerInputSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const result = await register(context, validation.value);

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sessionToken")?.value;

  if (sessionToken) {
    await logout(context, { token: sessionToken });
    cookieStore.delete("sessionToken");
  }

  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawData = {
    email: formData.get("email"),
  };

  const validation = validate(passwordResetInputSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const result = await requestPasswordReset(context, validation.value);

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sessionToken")?.value;

  if (!sessionToken) {
    return null;
  }

  const result = await validateSession(context, { token: sessionToken });

  if (result.isErr()) {
    return null;
  }

  return result.value.user;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
