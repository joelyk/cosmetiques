const normalizeEmailList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

export const env = {
  hasSupabaseClient: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  hasSupabaseRead: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  ),
  hasSupabaseAdmin: Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  whatsappOrderNumber: (process.env.WHATSAPP_ORDER_NUMBER ?? "237600000000")
    .replace(/[^\d]/g, ""),
  superAdminEmails: normalizeEmailList(process.env.SUPER_ADMIN_EMAILS),
  adminEmails: normalizeEmailList(process.env.ADMIN_EMAILS),
};
