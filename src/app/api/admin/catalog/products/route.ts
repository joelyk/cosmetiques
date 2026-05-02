import { z } from "zod";

import { auth } from "@/auth";
import { getCatalogSnapshot } from "@/lib/catalog-server";
import { canManageCatalog } from "@/lib/roles";
import { createSupabaseAdminClient } from "@/lib/supabase";

const ProductSchema = z.object({
  id: z.string().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  categoryId: z.string().min(1).max(120),
  brand: z.string().max(120).optional(),
  shortDescription: z.string().min(4).max(240),
  description: z.string().min(8).max(4000),
  priceCents: z.number().int().nonnegative().max(999999999),
  currency: z.literal("XAF"),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative().max(100000),
  clicks: z.number().int().nonnegative().max(10000000),
  featured: z.boolean(),
  heroImage: z.string().min(1).max(240),
  gallery: z.array(z.string().min(1).max(240)).min(1).max(8),
  tags: z.array(z.string().min(1).max(40)).max(12),
  stockLabel: z.string().min(1).max(80),
  volumeLabel: z.string().max(40).optional(),
  badge: z.string().max(80).optional(),
  status: z.enum(["active", "draft", "archived"]),
});

const normalizeOptional = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!canManageCatalog(session?.user?.role ?? "guest")) {
    return Response.json({ error: "Acces refuse." }, { status: 403 });
  }

  const payload = ProductSchema.safeParse(await request.json());

  if (!payload.success) {
    return Response.json({ error: "Fiche produit invalide." }, { status: 400 });
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

  const { categories } = await getCatalogSnapshot();
  const category = categories.find((entry) => entry.id === payload.data.categoryId);

  if (!category) {
    return Response.json({ error: "Categorie inconnue." }, { status: 400 });
  }

  if (category.brandRequired && !payload.data.brand?.trim()) {
    return Response.json(
      { error: "La marque est obligatoire pour cette categorie." },
      { status: 400 },
    );
  }

  const gallery = Array.from(
    new Set([payload.data.heroImage, ...payload.data.gallery].filter(Boolean)),
  );
  const tags = Array.from(
    new Set(payload.data.tags.map((tag) => tag.trim()).filter(Boolean)),
  );

  const { error } = await supabase.from("catalog_products").upsert(
    {
      id: payload.data.id,
      slug: payload.data.slug,
      name: payload.data.name,
      category_id: payload.data.categoryId,
      brand: normalizeOptional(payload.data.brand),
      short_description: payload.data.shortDescription,
      description: payload.data.description,
      price_cents: payload.data.priceCents,
      currency: payload.data.currency,
      rating: payload.data.rating,
      review_count: payload.data.reviewCount,
      clicks: payload.data.clicks,
      featured: payload.data.featured,
      hero_image: payload.data.heroImage,
      gallery,
      tags,
      stock_label: payload.data.stockLabel,
      volume_label: normalizeOptional(payload.data.volumeLabel),
      badge: normalizeOptional(payload.data.badge),
      status: payload.data.status,
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
            : "Impossible de sauvegarder ce produit.",
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
