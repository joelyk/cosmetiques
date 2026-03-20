import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type {
  AdminInvite,
  AdminInviteStatus,
  AdminMemberRole,
  AdminTeamMember,
  UserRole,
} from "@/types/catalog";

type AdminMemberRow = {
  email: string;
  role: AdminMemberRole | "admin";
  invited_by_email: string | null;
  created_at: string;
};

type AdminInviteRow = {
  id: string;
  email: string;
  role: AdminMemberRole | "admin";
  status: AdminInviteStatus;
  invited_by_email: string | null;
  created_at: string;
  expires_at: string;
  token: string;
};

type AcceptInviteResult =
  | { ok: true; role: UserRole }
  | {
      ok: false;
      reason:
        | "missing_token"
        | "invalid"
        | "expired"
        | "revoked"
        | "already_accepted"
        | "email_mismatch"
        | "missing_supabase";
    };

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const normalizeAdminRole = (
  role?: AdminMemberRole | "admin" | null,
): AdminMemberRole | null => {
  if (!role) {
    return null;
  }

  if (role === "admin") {
    return "admin_sales";
  }

  return role;
};

const normalizeInviteRole = (
  role?: AdminMemberRole | "admin" | null,
): AdminInvite["role"] => {
  const normalizedRole = normalizeAdminRole(role);

  return normalizedRole === "admin_catalog" ? "admin_catalog" : "admin_sales";
};

const inviteLifetimeInDays = 7;

const getInviteUrl = (token: string) => `/invitation-admin?token=${token}`;

export const canManageAdminTeam = (role: UserRole) => role === "super_admin";

const getDatabaseAdminRole = async (email?: string | null) => {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("admin_members")
      .select("role")
      .eq("email", normalized)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return normalizeAdminRole(data.role as AdminMemberRole | "admin" | null);
  } catch {
    return null;
  }
};

export const getUserRole = async (email?: string | null): Promise<UserRole> => {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return "guest";
  }

  if (env.superAdminEmails.includes(normalized)) {
    return "super_admin";
  }

  const databaseRole = await getDatabaseAdminRole(normalized);
  if (databaseRole === "super_admin") {
    return "super_admin";
  }

  if (databaseRole === "admin_catalog" || databaseRole === "admin_sales") {
    return databaseRole;
  }

  if (env.adminEmails.includes(normalized)) {
    return "admin_sales";
  }

  return "customer";
};

export const getAdminTeamSnapshot = async ({
  origin,
}: {
  origin: string;
}) => {
  const members = new Map<string, AdminTeamMember>();

  for (const email of env.superAdminEmails) {
    members.set(email, {
      email,
      role: "super_admin",
      source: "env_super_admin",
      createdAt: null,
      invitedByEmail: null,
      canRevoke: false,
    });
  }

  for (const email of env.adminEmails) {
    if (!members.has(email)) {
      members.set(email, {
        email,
        role: "admin_sales",
        source: "env_admin",
        createdAt: null,
        invitedByEmail: null,
        canRevoke: false,
      });
    }
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      sharedEnabled: false,
      members: [...members.values()].sort((left, right) =>
        left.email.localeCompare(right.email),
      ),
      invites: [] as AdminInvite[],
    };
  }

  try {
    const [membersResponse, invitesResponse] = await Promise.all([
      supabase
        .from("admin_members")
        .select("email, role, invited_by_email, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_invites")
        .select("id, email, role, status, invited_by_email, created_at, expires_at, token")
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false }),
    ]);

    if (membersResponse.error || invitesResponse.error) {
      return {
        sharedEnabled: false,
        members: [...members.values()].sort((left, right) =>
          left.email.localeCompare(right.email),
        ),
        invites: [] as AdminInvite[],
      };
    }

    for (const entry of (membersResponse.data ?? []) as AdminMemberRow[]) {
      const email = normalizeEmail(entry.email);
      if (env.superAdminEmails.includes(email) || env.adminEmails.includes(email)) {
        continue;
      }

      members.set(email, {
        email,
        role: normalizeAdminRole(entry.role) ?? "admin_sales",
        source: "database",
        createdAt: entry.created_at,
        invitedByEmail: entry.invited_by_email,
        canRevoke: true,
      });
    }

    const invites = ((invitesResponse.data ?? []) as AdminInviteRow[])
      .map((entry) => ({
        id: entry.id,
        email: normalizeEmail(entry.email),
        role: normalizeInviteRole(entry.role),
        status:
          entry.status === "pending" &&
          new Date(entry.expires_at).getTime() < Date.now()
            ? "expired"
            : entry.status,
        invitedByEmail: entry.invited_by_email,
        createdAt: entry.created_at,
        expiresAt: entry.expires_at,
        inviteUrl: `${origin}${getInviteUrl(entry.token)}`,
      }))
      .filter((entry) => entry.status === "pending") satisfies AdminInvite[];

    return {
      sharedEnabled: true,
      members: [...members.values()].sort((left, right) =>
        left.email.localeCompare(right.email),
      ),
      invites,
    };
  } catch {
    return {
      sharedEnabled: false,
      members: [...members.values()].sort((left, right) =>
        left.email.localeCompare(right.email),
      ),
      invites: [] as AdminInvite[],
    };
  }
};

export const createAdminInvite = async ({
  email,
  role,
  invitedByEmail,
  origin,
}: {
  email: string;
  role: AdminInvite["role"];
  invitedByEmail: string;
  origin: string;
}) => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedInvitedByEmail = normalizeEmail(invitedByEmail);

  if (!normalizedEmail || !normalizedInvitedByEmail) {
    throw new Error("Email admin invalide.");
  }

  if (env.superAdminEmails.includes(normalizedEmail)) {
    throw new Error("Cet email est deja super admin via la configuration.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error(
      "Supabase admin n est pas configure. Impossible de creer des invitations partagees.",
    );
  }

  const currentRole = await getUserRole(normalizedEmail);
  if (
    currentRole === "admin_catalog" ||
    currentRole === "admin_sales" ||
    currentRole === "super_admin"
  ) {
    throw new Error("Cet email dispose deja d un acces admin.");
  }

  await supabase
    .from("admin_invites")
    .update({ status: "revoked" })
    .eq("email", normalizedEmail)
    .eq("status", "pending");

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(
    Date.now() + inviteLifetimeInDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const inviteId = randomUUID();

  const { error } = await supabase.from("admin_invites").insert({
    id: inviteId,
    email: normalizedEmail,
    role,
    status: "pending",
    invited_by_email: normalizedInvitedByEmail,
    token,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error("Impossible de creer le lien d invitation admin.");
  }

  return {
    id: inviteId,
    email: normalizedEmail,
    role,
    inviteUrl: `${origin}${getInviteUrl(token)}`,
    expiresAt,
  };
};

export const revokeAdminInvite = async (inviteId: string) => {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin n est pas configure.");
  }

  const { error } = await supabase
    .from("admin_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId);

  if (error) {
    throw new Error("Impossible de revoquer ce lien d invitation.");
  }
};

export const revokeAdminMember = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);

  if (
    !normalizedEmail ||
    env.superAdminEmails.includes(normalizedEmail) ||
    env.adminEmails.includes(normalizedEmail)
  ) {
    throw new Error("Cet acces fixe ne peut pas etre revoque ici.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin n est pas configure.");
  }

  const { error } = await supabase
    .from("admin_members")
    .delete()
    .eq("email", normalizedEmail);

  if (error) {
    throw new Error("Impossible de retirer cet admin.");
  }
};

export const acceptAdminInvite = async ({
  token,
  email,
}: {
  token?: string | null;
  email?: string | null;
}): Promise<AcceptInviteResult> => {
  const normalizedEmail = normalizeEmail(email);

  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, reason: "missing_supabase" };
  }

  const { data, error } = await supabase
    .from("admin_invites")
    .select("id, email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: "invalid" };
  }

  const invite = data as {
    id: string;
    email: string;
    role: AdminMemberRole | "admin";
    status: AdminInviteStatus;
    expires_at: string;
  };

  if (invite.status === "revoked") {
    return { ok: false, reason: "revoked" };
  }

  if (invite.status === "accepted") {
    return { ok: false, reason: "already_accepted" };
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await supabase
      .from("admin_invites")
      .update({ status: "expired" })
      .eq("id", invite.id);

    return { ok: false, reason: "expired" };
  }

  if (normalizeEmail(invite.email) !== normalizedEmail) {
    return { ok: false, reason: "email_mismatch" };
  }

  const memberUpsert = await supabase.from("admin_members").upsert(
    {
      email: normalizedEmail,
      role: normalizeAdminRole(invite.role) ?? "admin_sales",
    },
    {
      onConflict: "email",
    },
  );

  if (memberUpsert.error) {
    return { ok: false, reason: "invalid" };
  }

  await supabase
    .from("admin_invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_email: normalizedEmail,
    })
    .eq("id", invite.id);

  return {
    ok: true,
    role: normalizeAdminRole(invite.role) ?? "admin_sales",
  };
};
