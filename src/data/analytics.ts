import type { AnalyticsPoint, ProductPerformance } from "@/types/catalog";

export const trafficAnalytics: AnalyticsPoint[] = [
  { label: "Lun", visitors: 124, productClicks: 46, checkoutRequests: 7 },
  { label: "Mar", visitors: 138, productClicks: 54, checkoutRequests: 9 },
  { label: "Mer", visitors: 160, productClicks: 67, checkoutRequests: 11 },
  { label: "Jeu", visitors: 142, productClicks: 59, checkoutRequests: 8 },
  { label: "Ven", visitors: 176, productClicks: 77, checkoutRequests: 13 },
  { label: "Sam", visitors: 218, productClicks: 95, checkoutRequests: 16 },
  { label: "Dim", visitors: 205, productClicks: 89, checkoutRequests: 14 },
];

export const performanceAnalytics: ProductPerformance[] = [
  {
    productId: "nuit-saffran",
    productName: "Nuit Saffran",
    clicks: 214,
    favorites: 76,
    checkoutRequests: 29,
    rating: 4.9,
  },
  {
    productId: "fleur-dambre",
    productName: "Fleur d'Ambre",
    clicks: 169,
    favorites: 54,
    checkoutRequests: 21,
    rating: 4.7,
  },
  {
    productId: "velours-karite",
    productName: "Velours Karite",
    clicks: 94,
    favorites: 33,
    checkoutRequests: 12,
    rating: 4.8,
  },
  {
    productId: "brume-blanche",
    productName: "Brume Blanche",
    clicks: 132,
    favorites: 27,
    checkoutRequests: 10,
    rating: 4.5,
  },
];

export const adminInsights = [
  "Nuit Saffran convertit bien. Bon candidat pour une mise en avant homepage et un stock surveille.",
  "Brume Blanche genere du clic mais moins de demandes WhatsApp. L'image ou l'offre merite d'etre retravaillee.",
  "Velours Karite montre qu'une extension vers le soin corps est coherente sans casser la structure boutique.",
];
