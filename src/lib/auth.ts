import { cookies } from "next/headers";
import { context } from "@/context";
import { validateSession } from "@/core/application/auth/validateSession";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("sessionId")?.value;

  if (!sessionId) {
    return null;
  }

  const result = await validateSession(context, { token: sessionId });

  if (result.isErr()) {
    return null;
  }

  return result.value.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}
