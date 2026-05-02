import { auth } from "@/auth";
import {
  categories as starterCategories,
  products as starterProducts,
  promotions as starterPromotions,
} from "@/data/catalog";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST() {
  const session = await auth();

  if (session?.user?.role !== "super_admin") {
    return Response.json(
      { error: "Seul le super admin peut initialiser Supabase." },
      { status: 403 },
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

  const { count, error: countError } = await supabase
    .from("catalog_products")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return Response.json(
      {
        error:
          countError.code === "42P01"
            ? "La table Supabase n'existe pas encore. Execute d'abord supabase/schema.sql."
            : "Impossible de verifier l'etat du catalogue partage.",
      },
      { status: 500 },
    );
  }

  if ((count ?? 0) > 0) {
    return Response.json(
      { error: "Le catalogue partage est deja initialise." },
      { status: 409 },
    );
  }

  const categoryRows = starterCategories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    short_description: category.shortDescription,
    description: category.description,
    brand_required: category.brandRequired,
    accent: category.accent,
    sort_order: category.sortOrder,
    is_active: category.isActive,
  }));

  const productRows = starterProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category_id: product.categoryId,
    brand: product.brand ?? null,
    short_description: product.shortDescription,
    description: product.description,
    price_cents: product.priceCents,
    currency: product.currency,
    rating: product.rating,
    review_count: product.reviewCount,
    clicks: product.clicks,
    featured: product.featured,
    hero_image: product.heroImage,
    gallery: product.gallery,
    tags: product.tags,
    stock_label: product.stockLabel,
    volume_label: product.volumeLabel ?? null,
    badge: product.badge ?? null,
    status: product.status,
  }));

  const promotionRows = starterPromotions.map((promotion) => ({
    id: promotion.id,
    code: promotion.code,
    title: promotion.title,
    description: promotion.description,
    discount_percent: promotion.discountPercent,
    category_id: promotion.categoryId ?? null,
    product_id: promotion.productId ?? null,
    is_active: promotion.isActive,
  }));

  const categoryInsert = await supabase.from("catalog_categories").insert(categoryRows);
  if (categoryInsert.error) {
    return Response.json(
      { error: "Impossible d'initialiser les categories." },
      { status: 500 },
    );
  }

  const productInsert = await supabase.from("catalog_products").insert(productRows);
  if (productInsert.error) {
    return Response.json(
      { error: "Impossible d'initialiser les produits." },
      { status: 500 },
    );
  }

  const promotionInsert = await supabase.from("promotions").insert(promotionRows);
  if (promotionInsert.error) {
    return Response.json(
      { error: "Impossible d'initialiser les promotions." },
      { status: 500 },
    );
  }

  const settingsInsert = await supabase.from("store_settings").upsert(
    {
      id: "main",
      store_name: "Josy Cosmetics",
      whatsapp_order_number: env.whatsappOrderNumber,
      checkout_description:
        "Le site prepare une demande claire vers le WhatsApp officiel de la boutique pour confirmer la commande, le mode de paiement et la livraison.",
      checkout_trust_note:
        "Apres validation, vous serez redirige vers notre WhatsApp officiel pour confirmer votre commande et recevoir les instructions Mobile Money ou Orange Money.",
      whatsapp_button_label: "Payer via WhatsApp",
    },
    {
      onConflict: "id",
    },
  );

  if (settingsInsert.error) {
    return Response.json(
      { error: "Impossible d'initialiser les reglages boutique." },
      { status: 500 },
    );
  }

  return Response.json({
    ok: true,
    counts: {
      categories: categoryRows.length,
      products: productRows.length,
      promotions: promotionRows.length,
    },
  });
}
