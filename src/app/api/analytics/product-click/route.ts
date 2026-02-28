import { z } from "zod";

import { hasKnownProductId } from "@/lib/catalog-server";
import { createSupabaseAdminClient } from "@/lib/supabase";

const ProductClickSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = ProductClickSchema.safeParse(await request.json());

  if (!payload.success) {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!(await hasKnownProductId(payload.data.productId))) {
    return Response.json({ error: "Produit inconnu." }, { status: 404 });
  }

  const supabase = createSupabaseAdminClient();

  if (supabase) {
    await supabase.from("product_click_events").insert({
      product_id: payload.data.productId,
      source: "site",
    });
  }

  return Response.json({ ok: true });
}
