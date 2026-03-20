import { z } from "zod";

import { auth } from "@/auth";
import { canManageSales } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabase";

const SettingsSchema = z.object({
  storeName: z.string().min(2).max(120),
  whatsappOrderNumber: z.string().min(8).max(24),
  checkoutDescription: z.string().min(12).max(500),
  checkoutTrustNote: z.string().min(12).max(500),
  whatsappButtonLabel: z.string().min(3).max(80),
});

const normalizePhoneNumber = (value: string) => value.replace(/[^\d]/g, "");

export async function POST(request: Request) {
  const session = await auth();

  if (!canManageSales(session?.user?.role ?? "guest")) {
    return Response.json({ error: "Acces refuse." }, { status: 403 });
  }

  const payload = SettingsSchema.safeParse(await request.json());

  if (!payload.success) {
    return Response.json(
      { error: "Les reglages boutique sont invalides." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return Response.json(
      {
        error:
          "Configuration manquante. Ajoute NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("store_settings").upsert(
    {
      id: "main",
      store_name: payload.data.storeName.trim(),
      whatsapp_order_number: normalizePhoneNumber(payload.data.whatsappOrderNumber),
      checkout_description: payload.data.checkoutDescription.trim(),
      checkout_trust_note: payload.data.checkoutTrustNote.trim(),
      whatsapp_button_label: payload.data.whatsappButtonLabel.trim(),
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    return Response.json(
      {
        error:
          error.code === "42P01"
            ? "La table store_settings n existe pas encore. Execute d abord supabase/schema.sql."
            : "Impossible de sauvegarder les reglages boutique.",
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
