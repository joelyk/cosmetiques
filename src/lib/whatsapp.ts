import { buildCategoryMap, buildProductMap } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { CartItem, Product, ProductCategory } from "@/types/catalog";

type CheckoutDetails = {
  customerName: string;
  customerPhone: string;
  city: string;
  paymentMethod: "Mobile Money" | "Orange Money";
  notes?: string;
};

export const buildOrderLines = ({
  items,
  products,
}: {
  items: CartItem[];
  products: Product[];
}) => {
  const productMap = buildProductMap(products);

  return items
    .map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        return null;
      }

      return {
        product,
        quantity: item.quantity,
        lineTotalCents: product.priceCents * item.quantity,
      };
    })
    .filter(
      (
        line,
      ): line is {
        product: Product;
        quantity: number;
        lineTotalCents: number;
      } => Boolean(line),
    );
};

export const buildWhatsAppOrderMessage = ({
  items,
  details,
  products,
  categories,
}: {
  items: CartItem[];
  details: CheckoutDetails;
  products: Product[];
  categories: ProductCategory[];
}) => {
  const lines = buildOrderLines({ items, products });
  const categoryMap = buildCategoryMap(categories);
  const totalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);

  return [
    "Bonjour Josy Cosmetics,",
    "",
    "Je souhaite confirmer cette commande :",
    `Client : ${details.customerName}`,
    `Telephone : ${details.customerPhone}`,
    `Ville : ${details.city}`,
    `Paiement souhaite : ${details.paymentMethod}`,
    "",
    "Articles :",
    ...lines.map(
      (line) =>
        `- ${line.product.name} (${categoryMap.get(line.product.categoryId)?.name ?? "Produit"}) x${line.quantity} = ${formatPrice(line.lineTotalCents, line.product.currency)}`,
    ),
    "",
    `Total estimatif : ${formatPrice(totalCents, "XAF")}`,
    details.notes ? `Notes : ${details.notes}` : null,
    "",
    "Merci de me confirmer la disponibilite, le montant final et les instructions de paiement Mobile Money / Orange Money.",
  ]
    .filter(Boolean)
    .join("\n");
};
