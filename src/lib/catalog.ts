import {
  categories as fallbackCategories,
  products as fallbackProducts,
  promotions as fallbackPromotions,
} from "@/data/catalog";
import type { Product, ProductCategory, Promotion } from "@/types/catalog";

export const categoryMap = new Map(
  fallbackCategories.map((category) => [category.id, category]),
);
export const productMap = new Map(
  fallbackProducts.map((product) => [product.id, product]),
);
export const productSlugMap = new Map(
  fallbackProducts.map((product) => [product.slug, product]),
);

export const buildCategoryMap = (categories: ProductCategory[]) =>
  new Map(categories.map((category) => [category.id, category]));

export const buildProductMap = (products: Product[]) =>
  new Map(products.map((product) => [product.id, product]));

export const buildProductSlugMap = (products: Product[]) =>
  new Map(products.map((product) => [product.slug, product]));

export const getFeaturedProducts = (products: Product[]) =>
  products.filter(
    (product) => product.featured && product.status === "active",
  );

export const getTopRatedProducts = (products: Product[]) =>
  [...products]
    .filter((product) => product.status === "active")
    .sort((left, right) => right.rating - left.rating)
    .slice(0, 4);

export const getActivePromotions = (promotions: Promotion[]) =>
  promotions.filter((promotion) => promotion.isActive);

export const searchProducts = (
  products: Product[],
  query?: string,
  categoryId?: string,
) => {
  const normalizedQuery = query?.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory = categoryId ? product.categoryId === categoryId : true;
    const matchesStatus = product.status === "active";
    const matchesQuery = normalizedQuery
      ? [product.name, product.brand, product.shortDescription, ...product.tags]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery))
      : true;

    return matchesCategory && matchesQuery && matchesStatus;
  });
};

export { fallbackCategories, fallbackProducts, fallbackPromotions };
