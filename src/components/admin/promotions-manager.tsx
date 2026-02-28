"use client";

import { useEffect, useState, useTransition } from "react";
import { Percent, Plus, Save } from "lucide-react";

import type { Product, ProductCategory, Promotion } from "@/types/catalog";

const STORAGE_KEY = "era-beauty-admin-promotion-draft";

const buildNewPromotion = (): Promotion => ({
  id: `promotion-${Date.now()}`,
  code: "PROMO10",
  title: "Nouvelle promotion",
  description: "Description a completer",
  discountPercent: 10,
  categoryId: "",
  productId: "",
  isActive: true,
});

export function PromotionsManager({
  categories,
  products,
  promotions,
  sharedEnabled,
}: {
  categories: ProductCategory[];
  products: Product[];
  promotions: Promotion[];
  sharedEnabled: boolean;
}) {
  const [draftPromotions, setDraftPromotions] = useState(promotions);
  const [selectedId, setSelectedId] = useState(promotions[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (sharedEnabled) {
      return;
    }

    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return;
    }

    try {
      const parsed = JSON.parse(rawValue) as Promotion[];
      if (parsed.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraftPromotions(parsed);
        setSelectedId(parsed[0]?.id ?? "");
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [sharedEnabled]);

  const selectedPromotion =
    draftPromotions.find((promotion) => promotion.id === selectedId) ??
    draftPromotions[0];

  const updatePromotion = <Key extends keyof Promotion>(
    field: Key,
    value: Promotion[Key],
  ) => {
    setDraftPromotions((current) =>
      current.map((promotion) =>
        promotion.id === selectedId ? { ...promotion, [field]: value } : promotion,
      ),
    );
  };

  const createPromotion = () => {
    const nextPromotion = buildNewPromotion();
    setDraftPromotions((current) => [nextPromotion, ...current]);
    setSelectedId(nextPromotion.id);
    setStatus("Nouvelle promo creee.");
  };

  const savePromotion = async () => {
    if (!selectedPromotion) {
      return;
    }

    if (!sharedEnabled) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPromotions));
      setStatus(
        "Promos sauvegardees localement dans ce navigateur. Active Supabase pour les partager.",
      );
      return;
    }

    const response = await fetch("/api/admin/catalog/promotions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...selectedPromotion,
        code: selectedPromotion.code.toUpperCase().replace(/\s+/g, "-"),
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      setStatus(payload.error ?? "Impossible de sauvegarder cette promo.");
      return;
    }

    setDraftPromotions((current) =>
      current.map((promotion) =>
        promotion.id === selectedPromotion.id
          ? {
              ...selectedPromotion,
              code: selectedPromotion.code.toUpperCase().replace(/\s+/g, "-"),
            }
          : promotion,
      ),
    );
    setStatus("Promotion partagee sauvegardee dans Supabase.");
  };

  if (!selectedPromotion) {
    return (
      <section className="panel p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Promotions</p>
            <h2 className="mt-2 text-2xl font-semibold">
              Codes promo et offres ciblables
            </h2>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={createPromotion}
          >
            <Plus className="h-4 w-4" />
            Nouvelle promo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Promotions</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Codes promo et offres ciblables
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
            Le second admin peut lancer des offres generales, par categorie ou
            sur un produit precis pour relever les clics et les demandes
            WhatsApp.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={createPromotion}
          >
            <Plus className="h-4 w-4" />
            Nouvelle promo
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={isPending}
            onClick={() => startTransition(() => void savePromotion())}
          >
            <Save className="h-4 w-4" />
            {isPending ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>

      {status ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {status}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          {draftPromotions.map((promotion) => (
            <button
              key={promotion.id}
              type="button"
              className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                promotion.id === selectedId
                  ? "border-[color:var(--accent-strong)] bg-[color:var(--card-soft)]"
                  : "border-[color:var(--line)] bg-white"
              }`}
              onClick={() => setSelectedId(promotion.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{promotion.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {promotion.code}
                  </p>
                </div>
                <Percent className="h-4 w-4 text-[color:var(--accent-strong)]" />
              </div>
            </button>
          ))}
        </aside>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Code promo</span>
            <input
              value={selectedPromotion.code}
              onChange={(event) =>
                updatePromotion(
                  "code",
                  event.target.value.toUpperCase().replace(/\s+/g, "-"),
                )
              }
            />
          </label>
          <label className="field">
            <span>Reduction (%)</span>
            <input
              type="number"
              min="1"
              max="90"
              value={selectedPromotion.discountPercent}
              onChange={(event) =>
                updatePromotion(
                  "discountPercent",
                  Number(event.target.value || 0),
                )
              }
            />
          </label>
          <label className="field sm:col-span-2">
            <span>Titre</span>
            <input
              value={selectedPromotion.title}
              onChange={(event) => updatePromotion("title", event.target.value)}
            />
          </label>
          <label className="field sm:col-span-2">
            <span>Description</span>
            <textarea
              rows={3}
              value={selectedPromotion.description}
              onChange={(event) =>
                updatePromotion("description", event.target.value)
              }
            />
          </label>
          <label className="field">
            <span>Categorie ciblee</span>
            <select
              value={selectedPromotion.categoryId ?? ""}
              onChange={(event) =>
                updatePromotion("categoryId", event.target.value)
              }
            >
              <option value="">Toutes</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Produit cible</span>
            <select
              value={selectedPromotion.productId ?? ""}
              onChange={(event) => updatePromotion("productId", event.target.value)}
            >
              <option value="">Aucun</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field sm:col-span-2">
            <span className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPromotion.isActive}
                onChange={(event) =>
                  updatePromotion("isActive", event.target.checked)
                }
              />
              Promo active
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
