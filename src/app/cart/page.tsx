import { CartPageClient } from "@/components/cart/cart-page-client";
import { getCatalogSnapshot } from "@/lib/catalog-server";

export default async function CartPage() {
  const { products } = await getCatalogSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Panier</p>
        <h1 className="mt-2 text-4xl font-semibold">Preparer votre commande</h1>
      </div>
      <CartPageClient products={products} />
    </div>
  );
}
