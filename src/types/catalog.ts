export type UserRole = "guest" | "customer" | "admin" | "super_admin";

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  brandRequired: boolean;
  accent: string;
  sortOrder: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  brand?: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  currency: "XAF";
  rating: number;
  reviewCount: number;
  clicks: number;
  featured: boolean;
  heroImage: string;
  gallery: string[];
  tags: string[];
  stockLabel: string;
  volumeLabel?: string;
  badge?: string;
  status: "active" | "draft" | "archived";
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type AnalyticsPoint = {
  label: string;
  visitors: number;
  productClicks: number;
  checkoutRequests: number;
};

export type ProductPerformance = {
  productId: string;
  productName: string;
  clicks: number;
  favorites: number;
  checkoutRequests: number;
  rating: number;
};

export type Promotion = {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  categoryId?: string;
  productId?: string;
  isActive: boolean;
};

export type StoreSettings = {
  storeName: string;
  whatsappOrderNumber: string;
  checkoutDescription: string;
  checkoutTrustNote: string;
  whatsappButtonLabel: string;
};
