import "server-only";

import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/roles";
import { createSupabaseServerAuthClient } from "@/lib/supabase-auth-server";
import type { UserRole } from "@/types/catalog";

export type AppSession = {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: UserRole;
  };
};

const getDisplayName = (user: {
  email?: string | null;
  user_metadata?: { full_name?: unknown; name?: unknown };
}) => {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;

  return fullName ?? user.email ?? null;
};

export async function auth(): Promise<AppSession | null> {
  try {
    const supabase = await createSupabaseServerAuthClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        name: getDisplayName(user),
        role: getUserRole(user.email),
      },
    };
  } catch {
    return null;
  }
}

export async function signOut({
  redirectTo = "/",
}: {
  redirectTo?: string;
} = {}) {
  const supabase = await createSupabaseServerAuthClient();

  await supabase.auth.signOut();
  redirect(redirectTo);
}
