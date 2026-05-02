import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import {
  buildProductMap,
  fallbackCategories,
  fallbackProducts,
  fallbackPromotions,
} from "@/lib/catalog";
import { createSupabaseReadClient } from "@/lib/supabase";
import type { Product, ProductCategory, Promotion } from "@/types/catalog";

type CatalogSnapshot = {
  categories: ProductCategory[];
  products: Product[];
  promotions: Promotion[];
  source: "local" | "supabase";
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  brand_required: boolean;
  accent: string;
  sort_order: number | null;
  is_active: boolean | null;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  brand: string | null;
  short_description: string;
  description: string;
  price_cents: number;
  currency: "XAF";
  rating: number;
  review_count: number;
  clicks: number | null;
  featured: boolean | null;
  hero_image: string;
  gallery: unknown;
  tags: string[] | null;
  stock_label: string;
  volume_label: string | null;
  badge: string | null;
  status: Product["status"] | null;
};

type PromotionRow = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_percent: number;
  category_id: string | null;
  product_id: string | null;
  is_active: boolean | null;
};

const fallbackProductMap = buildProductMap(fallbackProducts);

const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
};

const normalizeCategory = (row: CategoryRow): ProductCategory => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  shortDescription: row.short_description,
  description: row.description,
  brandRequired: row.brand_required,
  accent: row.accent,
  sortOrder: row.sort_order ?? 0,
  isActive: row.is_active ?? true,
});

const normalizeProduct = (row: ProductRow): Product => {
  const gallery = toStringArray(row.gallery);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryId: row.category_id,
    brand: row.brand ?? undefined,
    shortDescription: row.short_description,
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    rating: row.rating,
    reviewCount: row.review_count,
    clicks: row.clicks ?? 0,
    featured: row.featured ?? false,
    heroImage: row.hero_image,
    gallery: gallery.length > 0 ? gallery : [row.hero_image],
    tags: row.tags ?? [],
    stockLabel: row.stock_label,
    volumeLabel: row.volume_label ?? undefined,
    badge: row.badge ?? undefined,
    status: row.status ?? "active",
  };
};

const normalizePromotion = (row: PromotionRow): Promotion => ({
  id: row.id,
  code: row.code,
  title: row.title,
  description: row.description,
  discountPercent: row.discount_percent,
  categoryId: row.category_id ?? undefined,
  productId: row.product_id ?? undefined,
  isActive: row.is_active ?? true,
});

const fallbackSnapshot: CatalogSnapshot = {
  categories: fallbackCategories,
  products: fallbackProducts,
  promotions: fallbackPromotions,
  source: "local",
};

export const getCatalogSnapshot = async (): Promise<CatalogSnapshot> => {
  noStore();

  const supabase = createSupabaseReadClient();
  if (!supabase) {
    return fallbackSnapshot;
  }

  try {
    const [categoryResponse, productResponse, promotionResponse] =
      await Promise.all([
        supabase
          .from("catalog_categories")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("catalog_products")
          .select("*")
          .order("featured", { ascending: false })
          .order("name", { ascending: true }),
        supabase
          .from("promotions")
          .select("*")
          .order("is_active", { ascending: false })
          .order("code", { ascending: true }),
      ]);

    if (categoryResponse.error || productResponse.error || promotionResponse.error) {
      return fallbackSnapshot;
    }

    if (!categoryResponse.data?.length || !productResponse.data?.length) {
      return fallbackSnapshot;
    }

    return {
      categories: (categoryResponse.data as CategoryRow[]).map(normalizeCategory),
      products: (productResponse.data as ProductRow[]).map(normalizeProduct),
      promotions: (promotionResponse.data as PromotionRow[]).map(
        normalizePromotion,
      ),
      source: "supabase",
    };
  } catch {
    return fallbackSnapshot;
  }
};

export const hasKnownProductId = async (productId: string) => {
  noStore();

  const supabase = createSupabaseReadClient();
  if (!supabase) {
    return fallbackProductMap.has(productId);
  }

  try {
    const { data, error } = await supabase
      .from("catalog_products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (!error) {
      return Boolean(data);
    }
  } catch {
    return fallbackProductMap.has(productId);
  }

  return fallbackProductMap.has(productId);
};
