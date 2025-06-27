import {
  getCurrentUser as getCurrentUserAction,
  requireAuth as requireAuthAction,
} from "@/actions/auth";

export async function getCurrentUser() {
  return getCurrentUserAction();
}

export async function requireAuth() {
  return requireAuthAction();
}
