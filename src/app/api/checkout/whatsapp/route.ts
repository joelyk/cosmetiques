import { z } from "zod";

import { getCatalogSnapshot } from "@/lib/catalog-server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getStoreSettings } from "@/lib/store-settings";
import { buildOrderLines, buildWhatsAppOrderMessage } from "@/lib/whatsapp";

const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().max(10),
      }),
    )
    .min(1),
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(6).max(40),
  city: z.string().min(2).max(120),
  paymentMethod: z.enum(["Mobile Money", "Orange Money"]),
  notes: z.string().max(240).optional(),
});

export async function POST(request: Request) {
  const payload = CheckoutSchema.safeParse(await request.json());

  if (!payload.success) {
    return Response.json(
      { error: "Les informations de commande sont incompletes." },
      { status: 400 },
    );
  }

  const { products, categories } = await getCatalogSnapshot();
  const { settings } = await getStoreSettings();
  const orderLines = buildOrderLines({
    items: payload.data.items,
    products,
  });

  if (orderLines.length !== payload.data.items.length) {
    return Response.json(
      { error: "Un produit du panier est invalide." },
      { status: 400 },
    );
  }

  const whatsappMessage = buildWhatsAppOrderMessage({
    items: payload.data.items,
    details: payload.data,
    products,
    categories,
    storeName: settings.storeName,
  });
  const url = `https://wa.me/${settings.whatsappOrderNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const supabase = createSupabaseAdminClient();

  if (supabase) {
    await supabase.from("checkout_requests").insert({
      customer_name: payload.data.customerName,
      customer_phone: payload.data.customerPhone,
      city: payload.data.city,
      payment_method: payload.data.paymentMethod,
      items_count: payload.data.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
      items: payload.data.items,
      channel: "whatsapp",
    });
  }

  return Response.json({ ok: true, url });
}

