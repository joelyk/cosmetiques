"use client";

import { useEffect, useState, useTransition } from "react";
import { Database, Download, ImagePlus, Plus, Save } from "lucide-react";

import type { Product, ProductCategory, UserRole } from "@/types/catalog";

const STORAGE_KEY = "josy-cosmetics-admin-product-draft";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const buildNewProduct = (categoryId: string): Product => {
  const nextId = `product-${Date.now()}`;

  return {
    id: nextId,
    slug: nextId,
    name: "Nouveau produit",
    categoryId,
    brand: "",
    shortDescription: "A completer",
    description: "Description a completer",
    priceCents: 0,
    currency: "XAF",
    rating: 4,
    reviewCount: 0,
    clicks: 0,
    featured: false,
    heroImage: "/products/nuit-saffran.svg",
    gallery: ["/products/nuit-saffran.svg"],
    tags: [],
    stockLabel: "Disponible",
    volumeLabel: "",
    badge: "",
    status: "draft",
  };
};

const mergeImageUrls = (existing: string[], incoming: string[]) =>
  Array.from(new Set([...incoming.filter(Boolean), ...existing.filter(Boolean)]));

export function ProductEditor({
  categories,
  products,
  sharedEnabled,
  source,
  role,
}: {
  categories: ProductCategory[];
  products: Product[];
  sharedEnabled: boolean;
  source: "local" | "supabase";
  role: UserRole;
}) {
  const [draftProducts, setDraftProducts] = useState(products);
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  useEffect(() => {
    if (sharedEnabled) {
      return;
    }

    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return;
    }

    try {
      const parsed = JSON.parse(rawValue) as Product[];
      if (parsed.length > 0) {
        setDraftProducts(parsed);
        setSelectedId(parsed[0]?.id ?? "");
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [sharedEnabled]);

  const selectedProduct =
    draftProducts.find((product) => product.id === selectedId) ?? draftProducts[0];
  const selectedCategory = categories.find(
    (category) => category.id === selectedProduct?.categoryId,
  );

  const updateProduct = <Key extends keyof Product>(field: Key, value: Product[Key]) => {
    setDraftProducts((current) =>
      current.map((product) =>
        product.id === selectedId ? { ...product, [field]: value } : product,
      ),
    );
  };

  const patchSelectedProduct = (patch: Partial<Product>) => {
    setDraftProducts((current) =>
      current.map((product) =>
        product.id === selectedId ? { ...product, ...patch } : product,
      ),
    );
  };

  const createProduct = () => {
    const nextProduct = buildNewProduct(categories[0]?.id ?? "perfume");
    setDraftProducts((current) => [nextProduct, ...current]);
    setSelectedId(nextProduct.id);
    setStatus("Nouveau brouillon produit cree.");
  };

  const exportDraft = () => {
    const blob = new Blob([JSON.stringify(draftProducts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "josy-cosmetics-products.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Export JSON pret pour GitHub ou une sauvegarde manuelle.");
  };

  const saveDraft = async () => {
    if (!selectedProduct) {
      return;
    }

    if (!sharedEnabled) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftProducts));
      setStatus(
        "Brouillon local sauvegarde dans ce navigateur admin. Active Supabase pour le partager aux deux admins.",
      );
      return;
    }

    const response = await fetch("/api/admin/catalog/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...selectedProduct,
        slug: slugify(selectedProduct.slug || selectedProduct.name),
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
    };

    if (!response.ok) {
      setStatus(payload.error ?? "Impossible de sauvegarder ce produit.");
      return;
    }

    setDraftProducts((current) =>
      current.map((product) =>
        product.id === selectedProduct.id
          ? { ...selectedProduct, slug: slugify(selectedProduct.slug || selectedProduct.name) }
          : product,
      ),
    );
    setStatus("Produit partage sauvegarde dans Supabase.");
  };

  const seedSharedCatalog = async () => {
    const response = await fetch("/api/admin/catalog/seed", {
      method: "POST",
    });

    const payload = (await response.json()) as {
      error?: string;
      counts?: {
        categories: number;
        products: number;
        promotions: number;
      };
    };

    if (!response.ok) {
      setStatus(payload.error ?? "Impossible d'initialiser Supabase.");
      return;
    }

    setStatus(
      `Supabase initialise avec ${payload.counts?.products ?? 0} produits. Recharge la page pour passer en mode partage.`,
    );
  };

  const uploadImageFile = async (file: File, variant: "hero" | "gallery") => {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("productName", selectedProduct.name);
    formData.set("variant", variant);

    const response = await fetch("/api/admin/upload-image", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as {
      error?: string;
      url?: string;
    };

    if (!response.ok || !payload.url) {
      throw new Error(payload.error ?? "Impossible de charger cette image.");
    }

    return payload.url;
  };

  const handleHeroImageUpload = async (file: File | null) => {
    if (!file) {
      return;
    }

    setStatus(null);
    setIsUploadingHero(true);

    try {
      const nextUrl = await uploadImageFile(file, "hero");
      patchSelectedProduct({
        heroImage: nextUrl,
        gallery: mergeImageUrls(
          selectedProduct.gallery.filter((entry) => entry !== selectedProduct.heroImage),
          [nextUrl],
        ),
      });
      setStatus("Image principale chargee depuis le PC et liee au produit.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Impossible de charger l image principale.",
      );
    } finally {
      setIsUploadingHero(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setStatus(null);
    setIsUploadingGallery(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files).slice(0, 6)) {
        uploadedUrls.push(await uploadImageFile(file, "gallery"));
      }

      patchSelectedProduct({
        gallery: mergeImageUrls(selectedProduct.gallery, uploadedUrls),
      });
      setStatus(`${uploadedUrls.length} image(s) galerie chargee(s) depuis le PC.`);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Impossible de charger les images galerie.",
      );
    } finally {
      setIsUploadingGallery(false);
    }
  };

  if (!selectedProduct) {
    return null;
  }

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Gestion produits</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Fiches produit et categories extensibles
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
            Mode actuel: {sharedEnabled ? "catalogue partage Supabase" : "brouillon local navigateur"}.
            L admin catalogue peut changer la categorie, la marque, les visuels
            et le statut produit sans toucher au code.
          </p>
          {source === "local" && sharedEnabled ? (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Supabase est configure, mais le catalogue partage n&apos;est pas encore initialise.
              Lance l&apos;initialisation une seule fois depuis ce tableau de bord.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={createProduct}
          >
            <Plus className="h-4 w-4" />
            Nouveau produit
          </button>
          {role === "super_admin" && sharedEnabled && source === "local" ? (
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              disabled={isPending}
              onClick={() => startTransition(() => void seedSharedCatalog())}
            >
              <Database className="h-4 w-4" />
              Initialiser Supabase
            </button>
          ) : null}
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={exportDraft}
          >
            <Download className="h-4 w-4" />
            Exporter JSON
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={isPending}
            onClick={() => startTransition(() => void saveDraft())}
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {draftProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                product.id === selectedId
                  ? "border-[color:var(--accent-strong)] bg-[color:var(--card-soft)]"
                  : "border-[color:var(--line)] bg-white"
              }`}
              onClick={() => setSelectedId(product.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {product.brand || "Sans marque"}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  {product.status}
                </span>
              </div>
            </button>
          ))}
        </aside>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Nom du produit</span>
            <input
              value={selectedProduct.name}
              onChange={(event) => {
                updateProduct("name", event.target.value);
                if (slugify(selectedProduct.slug) === slugify(selectedProduct.id)) {
                  updateProduct("slug", slugify(event.target.value));
                }
              }}
            />
          </label>
          <label className="field">
            <span>Slug</span>
            <input
              value={selectedProduct.slug}
              onChange={(event) => updateProduct("slug", slugify(event.target.value))}
            />
          </label>
          <label className="field">
            <span>Categorie</span>
            <select
              value={selectedProduct.categoryId}
              onChange={(event) => updateProduct("categoryId", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>
              Marque
              {selectedCategory?.brandRequired ? " (obligatoire)" : " (optionnel)"}
            </span>
            <input
              value={selectedProduct.brand ?? ""}
              onChange={(event) => updateProduct("brand", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Prix (XAF)</span>
            <input
              type="number"
              min="0"
              step="100"
              value={selectedProduct.priceCents / 100}
              onChange={(event) =>
                updateProduct("priceCents", Number(event.target.value || 0) * 100)
              }
            />
          </label>
          <label className="field">
            <span>Etat du stock</span>
            <input
              value={selectedProduct.stockLabel}
              onChange={(event) => updateProduct("stockLabel", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Volume</span>
            <input
              value={selectedProduct.volumeLabel ?? ""}
              onChange={(event) => updateProduct("volumeLabel", event.target.value)}
              placeholder="Ex: 100 ml"
            />
          </label>
          <label className="field">
            <span>Badge marketing</span>
            <input
              value={selectedProduct.badge ?? ""}
              onChange={(event) => updateProduct("badge", event.target.value)}
              placeholder="Ex: Signature"
            />
          </label>
          <label className="field">
            <span>Note</span>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={selectedProduct.rating}
              onChange={(event) =>
                updateProduct("rating", Number(event.target.value || 0))
              }
            />
          </label>
          <label className="field">
            <span>Nombre d&apos;avis</span>
            <input
              type="number"
              min="0"
              step="1"
              value={selectedProduct.reviewCount}
              onChange={(event) =>
                updateProduct("reviewCount", Number(event.target.value || 0))
              }
            />
          </label>
          <div className="field">
            <span>Image principale</span>
            <input
              value={selectedProduct.heroImage}
              onChange={(event) => updateProduct("heroImage", event.target.value)}
            />
            <label className="chip mt-2 inline-flex cursor-pointer items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              {isUploadingHero ? "Chargement..." : "Charger depuis mon PC"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                disabled={isUploadingHero}
                onChange={(event) =>
                  void handleHeroImageUpload(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
          <label className="field">
            <span>Statut</span>
            <select
              value={selectedProduct.status}
              onChange={(event) =>
                updateProduct(
                  "status",
                  event.target.value as Product["status"],
                )
              }
            >
              <option value="active">active</option>
              <option value="draft">draft</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="field sm:col-span-2">
            <span>Tags (separes par des virgules)</span>
            <input
              value={selectedProduct.tags.join(", ")}
              onChange={(event) =>
                updateProduct(
                  "tags",
                  event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                )
              }
              placeholder="parfum, best-seller, cadeau"
            />
          </label>
          <div className="field sm:col-span-2">
            <span>Galerie image (une URL par ligne)</span>
            <textarea
              rows={4}
              value={selectedProduct.gallery.join("\n")}
              onChange={(event) =>
                updateProduct(
                  "gallery",
                  event.target.value
                    .split("\n")
                    .map((entry) => entry.trim())
                    .filter(Boolean),
                )
              }
            />
            <label className="chip mt-2 inline-flex cursor-pointer items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              {isUploadingGallery ? "Chargement..." : "Ajouter depuis mon PC"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                multiple
                className="hidden"
                disabled={isUploadingGallery}
                onChange={(event) =>
                  void handleGalleryUpload(event.target.files)
                }
              />
            </label>
          </div>
          <label className="field sm:col-span-2">
            <span>Resume court</span>
            <textarea
              rows={3}
              value={selectedProduct.shortDescription}
              onChange={(event) =>
                updateProduct("shortDescription", event.target.value)
              }
            />
          </label>
          <label className="field sm:col-span-2">
            <span>Description complete</span>
            <textarea
              rows={5}
              value={selectedProduct.description}
              onChange={(event) => updateProduct("description", event.target.value)}
            />
          </label>
          <label className="field sm:col-span-2">
            <span className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedProduct.featured}
                onChange={(event) =>
                  updateProduct("featured", event.target.checked)
                }
              />
              Mettre en avant ce produit
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
