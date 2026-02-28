import { z } from "zod";

import { auth } from "@/auth";
import { canAccessAdmin } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabase";

const PromotionSchema = z.object({
  id: z.string().min(2).max(120),
  code: z.string().min(3).max(24).regex(/^[A-Z0-9-]+$/),
  title: z.string().min(2).max(80),
  description: z.string().min(4).max(240),
  discountPercent: z.number().int().min(1).max(90),
  categoryId: z.string().max(120).optional(),
  productId: z.string().max(120).optional(),
  isActive: z.boolean(),
});

const normalizeOptional = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!canAccessAdmin(session?.user?.role ?? "guest")) {
    return Response.json({ error: "Acces refuse." }, { status: 403 });
  }

  const payload = PromotionSchema.safeParse(await request.json());

  if (!payload.success) {
    return Response.json({ error: "Promo invalide." }, { status: 400 });
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

  const { error } = await supabase.from("promotions").upsert(
    {
      id: payload.data.id,
      code: payload.data.code,
      title: payload.data.title,
      description: payload.data.description,
      discount_percent: payload.data.discountPercent,
      category_id: normalizeOptional(payload.data.categoryId),
      product_id: normalizeOptional(payload.data.productId),
      is_active: payload.data.isActive,
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
            ? "La table Supabase n'existe pas encore. Execute d'abord supabase/schema.sql."
            : "Impossible de sauvegarder cette promo.",
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
