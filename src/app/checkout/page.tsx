import { CheckoutClient } from "@/components/cart/checkout-client";
import { getCatalogSnapshot } from "@/lib/catalog-server";

export default async function CheckoutPage() {
  const { products } = await getCatalogSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Validation</p>
        <h1 className="mt-2 text-4xl font-semibold">Paiement via WhatsApp</h1>
      </div>
      <CheckoutClient products={products} />
    </div>
  );
}
