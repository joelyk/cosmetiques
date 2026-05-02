import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase";

const PageVisitSchema = z.object({
  pathname: z.string().min(1).max(160),
  sessionId: z.string().min(8).max(120),
});

export async function POST(request: Request) {
  const payload = PageVisitSchema.safeParse(await request.json());

  if (!payload.success) {
    return Response.json({ error: "Requete invalide." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (supabase) {
    await supabase.from("page_visit_events").insert({
      pathname: payload.data.pathname,
      session_id: payload.data.sessionId,
      source: "site",
    });
  }

  return Response.json({ ok: true });
}
