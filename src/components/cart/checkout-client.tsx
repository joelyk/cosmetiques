"use client";

import { useState } from "react";
import { MessageCircleMore } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { buildProductMap } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Product, StoreSettings } from "@/types/catalog";

type CheckoutState = {
  customerName: string;
  customerPhone: string;
  city: string;
  paymentMethod: "Mobile Money" | "Orange Money";
  notes: string;
};

const defaultState: CheckoutState = {
  customerName: "",
  customerPhone: "",
  city: "",
  paymentMethod: "Mobile Money",
  notes: "",
};

export function CheckoutClient({
  products,
  settings,
}: {
  products: Product[];
  settings: StoreSettings;
}) {
  const { items } = useCart();
  const productMap = buildProductMap(products);
  const [formState, setFormState] = useState(defaultState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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

  const handleSubmit = async () => {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/checkout/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          ...formState,
          notes: formState.notes || undefined,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        url?: string;
      };

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Impossible d'ouvrir WhatsApp.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setError("Le lien WhatsApp n'a pas pu etre genere.");
    } finally {
      setIsPending(false);
    }
  };

  if (detailedItems.length === 0) {
    return (
      <section className="panel p-8">
        <h1 className="text-3xl font-semibold">Aucune commande a confirmer</h1>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          Ajoutez des produits au panier avant de lancer la demande de paiement.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="panel p-6">
        <div className="space-y-6">
          <div>
            <p className="eyebrow">Paiement assiste</p>
            <h1 className="mt-2 text-3xl font-semibold">
              Finaliser sur WhatsApp en toute confiance
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
              {settings.checkoutDescription}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span>Nom complet</span>
              <input
                value={formState.customerName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    customerName: event.target.value,
                  }))
                }
                placeholder="Ex: Grace N."
              />
            </label>
            <label className="field">
              <span>Telephone</span>
              <input
                value={formState.customerPhone}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    customerPhone: event.target.value,
                  }))
                }
                placeholder="Ex: +237 6 00 00 00 00"
              />
            </label>
            <label className="field">
              <span>Ville</span>
              <input
                value={formState.city}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                placeholder="Ex: Douala"
              />
            </label>
            <label className="field">
              <span>Methode de paiement</span>
              <select
                value={formState.paymentMethod}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    paymentMethod: event.target.value as
                      | "Mobile Money"
                      | "Orange Money",
                  }))
                }
              >
                <option>Mobile Money</option>
                <option>Orange Money</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Message complementaire</span>
            <textarea
              rows={4}
              value={formState.notes}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Ex: livraison quartier Bastos, appel avant envoi"
            />
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={isPending}
            onClick={handleSubmit}
          >
            <MessageCircleMore className="h-4 w-4" />
            {isPending ? "Preparation du message..." : settings.whatsappButtonLabel}
          </button>
        </div>
      </section>

      <aside className="panel h-fit p-6">
        <h2 className="text-xl font-semibold">Votre commande</h2>
        <div className="mt-4 space-y-3">
          {detailedItems.map((item) => (
            <div
              key={item.productId}
              className="flex items-start justify-between gap-4 border-b border-[color:var(--line)] pb-3 text-sm last:border-none"
            >
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-[color:var(--muted)]">Quantite: {item.quantity}</p>
              </div>
              <strong>{formatPrice(item.lineTotal, item.product.currency)}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-[color:var(--line)] pt-4">
          <div className="flex items-center justify-between text-sm">
            <span>Total estimatif</span>
            <strong>{formatPrice(total, "XAF")}</strong>
          </div>
        </div>

        <p className="mt-4 text-sm text-[color:var(--muted)]">
          {settings.checkoutTrustNote}
        </p>
      </aside>
    </div>
  );
}
