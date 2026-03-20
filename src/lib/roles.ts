import type { UserRole } from "@/types/catalog";

export const canAccessAdmin = (role: UserRole) =>
  role === "admin" || role === "super_admin";

