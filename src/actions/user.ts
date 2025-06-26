"use server";

// Removed revalidatePath import as it's not exported from next/navigation
import { z } from "zod/v4";
import { changePassword } from "@/core/application/user/changePassword";
import { updateProfile } from "@/core/application/user/updateProfile";
import { requireAuth } from "@/lib/auth";
import type { FormState } from "@/lib/formState";
import { validate } from "@/lib/validation";
import { context } from "./context";

const updateProfileSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "現在のパスワードを入力してください"),
  newPassword: z
    .string()
    .min(8, "新しいパスワードは8文字以上で入力してください"),
});

export async function updateProfileAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    name: formData.get("name"),
  };

  const validation = validate(updateProfileSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const result = await updateProfile(context, {
    id: user.id,
    ...validation.value,
  });

  if (result.isErr()) {
    return {
      input: rawData,
      error: result.error,
    };
  }

  // Page will be refreshed by Next.js navigation

  return {
    input: rawData,
    result: result.value,
    error: null,
  };
}

export async function changePasswordAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireAuth();

  const rawData = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  };

  const validation = validate(changePasswordSchema, rawData);
  if (validation.isErr()) {
    return {
      input: rawData,
      error: validation.error,
    };
  }

  const result = await changePassword(context, {
    userId: user.id,
    ...validation.value,
  });

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
