import type { UserRole } from "@/types/catalog";

export const canAccessAdmin = (role: UserRole) =>
  role === "admin_catalog" ||
  role === "admin_sales" ||
  role === "admin_manager" ||
  role === "super_admin";

export const canManageCatalog = (role: UserRole) =>
  role === "admin_catalog" ||
  role === "admin_manager" ||
  role === "super_admin";

export const canManageSales = (role: UserRole) =>
  role === "admin_sales" ||
  role === "admin_manager" ||
  role === "super_admin";

export const canViewAnalytics = (role: UserRole) =>
  role === "admin_sales" ||
  role === "admin_manager" ||
  role === "super_admin";

export const canInviteAdmins = (role: UserRole) =>
  role === "admin_manager" || role === "super_admin";

export const canRevokeAdmins = (role: UserRole) => role === "super_admin";

export const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case "super_admin":
      return "Super admin";
    case "admin_manager":
      return "Admin manager";
    case "admin_catalog":
      return "Admin catalogue";
    case "admin_sales":
      return "Admin ventes";
    case "customer":
      return "Cliente";
    default:
      return "Invite";
  }
};
