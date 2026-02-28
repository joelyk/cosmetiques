import { env } from "@/lib/env";
import type { UserRole } from "@/types/catalog";

export const getUserRole = (email?: string | null): UserRole => {
  const normalized = email?.trim().toLowerCase();

  if (!normalized) {
    return "guest";
  }

  if (env.superAdminEmails.includes(normalized)) {
    return "super_admin";
  }

  if (env.adminEmails.includes(normalized)) {
    return "admin";
  }

  return "customer";
};

export const canAccessAdmin = (role: UserRole) =>
  role === "admin" || role === "super_admin";
