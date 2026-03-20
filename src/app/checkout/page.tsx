import { CheckoutClient } from "@/components/cart/checkout-client";
import { getCatalogSnapshot } from "@/lib/catalog-server";
import { getStoreSettings } from "@/lib/store-settings";

export default async function CheckoutPage() {
  const { products } = await getCatalogSnapshot();
  const { settings } = await getStoreSettings();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Validation</p>
        <h1 className="mt-2 text-4xl font-semibold">Paiement via WhatsApp</h1>
      </div>
      <CheckoutClient products={products} settings={settings} />
    </div>
  );
}
