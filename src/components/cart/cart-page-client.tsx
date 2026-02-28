"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { buildProductMap } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

export function CartPageClient({ products }: { products: Product[] }) {
  const { items, removeItem, updateQuantity } = useCart();
  const productMap = buildProductMap(products);

  const detailedItems = items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        return null;
      }

      return {
        ...item,
        product,
        lineTotal: product.priceCents * item.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const total = detailedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  if (detailedItems.length === 0) {
    return (
      <section className="panel flex flex-col gap-4 p-8">
        <h1 className="text-3xl font-semibold">Votre panier est vide</h1>
        <p className="max-w-2xl text-sm text-[color:var(--muted)]">
          Ajoutez quelques produits. Le panier est conserve dans le navigateur
          pour garder un tunnel simple sans collecter de donnees sensibles.
        </p>
        <Link href="/catalog" className="btn-primary w-fit">
          Voir le catalogue
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="panel p-6">
        <div className="space-y-4">
          {detailedItems.map((item) => (
            <article
              key={item.productId}
              className="grid gap-4 border-b border-[color:var(--line)] py-4 last:border-none"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{item.product.name}</h2>
                  <p className="text-sm text-[color:var(--muted)]">
                    {item.product.shortDescription}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--ink)]/70">
                    {formatPrice(item.product.priceCents, item.product.currency)}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--line)] p-2 text-[color:var(--muted)] transition hover:border-red-300 hover:text-red-500"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Retirer ${item.product.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--line)] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label="Reduire la quantite"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label="Augmenter la quantite"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <strong>{formatPrice(item.lineTotal, item.product.currency)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="panel h-fit p-6">
        <h2 className="text-xl font-semibold">Resume</h2>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Articles</span>
            <span>{detailedItems.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total estimatif</span>
            <strong>{formatPrice(total, "XAF")}</strong>
          </div>
        </div>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          Le reglement final se confirme sur WhatsApp via Mobile Money ou Orange
          Money. Aucun paiement bancaire n&apos;est stocke sur le site.
        </p>
        <Link href="/checkout" className="btn-primary mt-6 block text-center">
          Continuer vers le paiement
        </Link>
      </aside>
    </div>
  );
}
