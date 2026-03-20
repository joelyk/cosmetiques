import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import {
  adminInsights as fallbackInsights,
  performanceAnalytics as fallbackPerformance,
  trafficAnalytics as fallbackTraffic,
} from "@/data/analytics";
import { buildCategoryMap } from "@/lib/catalog";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type {
  AnalyticsPoint,
  Product,
  ProductCategory,
  ProductPerformance,
} from "@/types/catalog";

type DashboardData = {
  summary: {
    visitors: number;
    productClicks: number;
    checkoutRequests: number;
  };
  traffic: AnalyticsPoint[];
  performance: ProductPerformance[];
  insights: string[];
  source: "fallback" | "supabase";
};

type EventRow = {
  created_at: string;
};

type VisitRow = EventRow & {
  session_id: string;
};

type ProductClickRow = EventRow & {
  product_id: string;
};

type CheckoutRequestRow = EventRow & {
  items: unknown;
};

const timezone = "Europe/Paris";

const dayKeyFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayLabelFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: timezone,
  weekday: "short",
});

const formatDayKey = (date: Date) => {
  const parts = dayKeyFormatter.formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";

  return `${year}-${month}-${day}`;
};

const getLastSevenDays = () => {
  const today = new Date();
  const days: { key: string; label: string }[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - offset);
    days.push({
      key: formatDayKey(current),
      label: dayLabelFormatter.format(current),
    });
  }

  return days;
};

const createFallbackDashboard = (): DashboardData => ({
  summary: {
    visitors: fallbackTraffic.reduce((sum, point) => sum + point.visitors, 0),
    productClicks: fallbackTraffic.reduce(
      (sum, point) => sum + point.productClicks,
      0,
    ),
    checkoutRequests: fallbackTraffic.reduce(
      (sum, point) => sum + point.checkoutRequests,
      0,
    ),
  },
  traffic: fallbackTraffic,
  performance: fallbackPerformance,
  insights: fallbackInsights,
  source: "fallback",
});

const getCheckoutItemEntries = (items: unknown) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("productId" in item) ||
        !("quantity" in item)
      ) {
        return null;
      }

      const productId =
        typeof item.productId === "string" ? item.productId : undefined;
      const quantity =
        typeof item.quantity === "number" ? item.quantity : Number(item.quantity);

      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        productId,
        quantity,
      };
    })
    .filter(
      (item): item is { productId: string; quantity: number } => Boolean(item),
    );
};

const buildInsights = ({
  performance,
  categories,
  products,
}: {
  performance: ProductPerformance[];
  categories: ProductCategory[];
  products: Product[];
}) => {
  if (!performance.some((product) => product.clicks > 0 || product.checkoutRequests > 0)) {
    return [
      "Le suivi live est actif, mais il n'y a pas encore assez de donnees pour produire un vrai feedback.",
      "Commencez par partager le site et verifier les courbes apres les premiers clics produit et demandes WhatsApp.",
      "L admin ventes pourra ensuite agir sur les promos, les messages checkout et les categories les plus sollicitees.",
    ];
  }

  const categoryMap = buildCategoryMap(categories);
  const productCategoryMap = new Map(
    products.map((product) => [product.id, product.categoryId]),
  );
  const topProduct = [...performance].sort((left, right) => right.clicks - left.clicks)[0];
  const lowConversionProduct = [...performance]
    .filter((product) => product.clicks >= 5)
    .sort((left, right) => {
      const leftRatio = left.checkoutRequests / Math.max(left.clicks, 1);
      const rightRatio = right.checkoutRequests / Math.max(right.clicks, 1);

      return leftRatio - rightRatio;
    })[0];

  const categoryClicks = new Map<string, number>();
  for (const item of performance) {
    const categoryId = productCategoryMap.get(item.productId);
    if (!categoryId) {
      continue;
    }
    categoryClicks.set(
      categoryId,
      (categoryClicks.get(categoryId) ?? 0) + item.clicks,
    );
  }

  const strongestCategory = [...categoryClicks.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0];

  return [
    topProduct
      ? `${topProduct.productName} est actuellement le produit le plus consulte. Il faut garder ce visuel et cette fiche en homepage.`
      : "Aucun produit ne domine encore le trafic.",
    lowConversionProduct
      ? `${lowConversionProduct.productName} genere de l'interet mais convertit moins bien vers WhatsApp. Priorite: image, offre ou promo ciblee.`
      : "Aucun produit ne montre encore un probleme clair de conversion.",
    strongestCategory
      ? `${categoryMap.get(strongestCategory[0])?.name ?? "Une categorie"} concentre le plus de clics. L admin ventes peut y attacher davantage d offres et de produits.`
      : "Aucune categorie ne se detache encore dans le trafic.",
  ];
};

export const getDashboardData = async ({
  products,
  categories,
}: {
  products: Product[];
  categories: ProductCategory[];
}): Promise<DashboardData> => {
  noStore();

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return createFallbackDashboard();
  }

  const dayFrames = getLastSevenDays();
  const startDay = dayFrames[0]?.key;

  try {
    const [visitResponse, clickResponse, checkoutResponse] = await Promise.all([
      supabase
        .from("page_visit_events")
        .select("created_at, session_id")
        .gte("created_at", `${startDay}T00:00:00.000Z`),
      supabase
        .from("product_click_events")
        .select("created_at, product_id")
        .gte("created_at", `${startDay}T00:00:00.000Z`),
      supabase
        .from("checkout_requests")
        .select("created_at, items")
        .gte("created_at", `${startDay}T00:00:00.000Z`),
    ]);

    if (visitResponse.error || clickResponse.error || checkoutResponse.error) {
      return createFallbackDashboard();
    }

    const visitRows = (visitResponse.data ?? []) as VisitRow[];
    const clickRows = (clickResponse.data ?? []) as ProductClickRow[];
    const checkoutRows = (checkoutResponse.data ?? []) as CheckoutRequestRow[];

    const trafficMap = new Map(
      dayFrames.map((frame) => [
        frame.key,
        {
          label: frame.label,
          visitors: 0,
          productClicks: 0,
          checkoutRequests: 0,
        },
      ]),
    );
    const visitorSets = new Map(dayFrames.map((frame) => [frame.key, new Set<string>()]));

    for (const row of visitRows) {
      const key = formatDayKey(new Date(row.created_at));
      const frame = trafficMap.get(key);
      const visitors = visitorSets.get(key);
      if (frame) {
        visitors?.add(row.session_id);
        frame.visitors = visitors?.size ?? frame.visitors;
      }
    }

    for (const row of clickRows) {
      const key = formatDayKey(new Date(row.created_at));
      const frame = trafficMap.get(key);
      if (frame) {
        frame.productClicks += 1;
      }
    }

    for (const row of checkoutRows) {
      const key = formatDayKey(new Date(row.created_at));
      const frame = trafficMap.get(key);
      if (frame) {
        frame.checkoutRequests += 1;
      }
    }

    const clickCounts = new Map<string, number>();
    for (const row of clickRows) {
      clickCounts.set(row.product_id, (clickCounts.get(row.product_id) ?? 0) + 1);
    }

    const checkoutCounts = new Map<string, number>();
    for (const row of checkoutRows) {
      for (const item of getCheckoutItemEntries(row.items)) {
        checkoutCounts.set(
          item.productId,
          (checkoutCounts.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }

    const performance = products
      .filter((product) => product.status !== "archived")
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        clicks: clickCounts.get(product.id) ?? 0,
        favorites: product.reviewCount,
        checkoutRequests: checkoutCounts.get(product.id) ?? 0,
        rating: product.rating,
      }))
      .sort((left, right) => right.clicks - left.clicks || right.rating - left.rating)
      .slice(0, 6);

    const traffic = dayFrames
      .map((frame) => trafficMap.get(frame.key))
      .filter((frame): frame is AnalyticsPoint => Boolean(frame));

    return {
      summary: {
        visitors: new Set(visitRows.map((row) => row.session_id)).size,
        productClicks: clickRows.length,
        checkoutRequests: checkoutRows.length,
      },
      traffic,
      performance,
      insights: buildInsights({ performance, categories, products }),
      source: "supabase",
    };
  } catch {
    return createFallbackDashboard();
  }
};
