import Link from "next/link";

import { ProductCard } from "@/components/ui/product-card";
import {
  getActivePromotions,
  getFeaturedProducts,
  getTopRatedProducts,
} from "@/lib/catalog";
import { getCatalogSnapshot } from "@/lib/catalog-server";

export default async function HomePage() {
  const { categories, products, promotions } = await getCatalogSnapshot();
  const visibleCategories = categories.filter((category) => category.isActive);
  const featuredProducts = getFeaturedProducts(products);
  const topRatedProducts = getTopRatedProducts(products);
  const activePromotions = getActivePromotions(promotions).slice(0, 3);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className="space-y-16">
      <section className="hero-card relative overflow-hidden px-6 py-10 md:px-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow">Lancement parfum, structure multi-categories</p>
            <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">
              Une boutique pensee pour vendre des parfums maintenant, puis toute
              une ligne cosmetique demain.
            </h1>
            <p className="mt-5 max-w-xl text-base text-[color:var(--muted)] md:text-lg">
              Josy Cosmetics demarre avec les parfums, mais la structure catalogue,
              administration et analytics est deja prete pour les gels douche,
              laits corporels, coffrets et futures categories.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className="btn-primary">
                Explorer les produits
              </Link>
              <Link href="/admin" className="btn-secondary">
                Voir espace admin
              </Link>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
              Site realise par GeniusClassrooms
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="panel bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Paiement simple
              </p>
              <p className="mt-4 text-3xl font-semibold">WhatsApp + Mobile Money</p>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Le bouton de paiement prepare un message securise vers le numero
                officiel du site.
              </p>
            </div>
            <div className="panel bg-white/75 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Deux roles admin
              </p>
              <p className="mt-4 text-3xl font-semibold">Email magic link</p>
              <p className="mt-3 text-sm text-[color:var(--muted)]">
                Connexion par lien email et roles admin pilotes par liste
                d&apos;emails, sans mot de passe local.
              </p>
            </div>
            <div className="panel bg-white/75 p-5 sm:col-span-2">
              <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--muted)]">
                Produits extensibles
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {visibleCategories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-4"
                  >
                    <p className="font-semibold">{category.name}</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">
                      {category.shortDescription}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {activePromotions.length > 0 ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Promotions actives</p>
              <h2 className="mt-2 text-3xl font-semibold">
                Codes promo pilotables par le second admin
              </h2>
            </div>
            <Link href="/admin" className="chip">
              Gerer les offres
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {activePromotions.map((promotion) => (
              <article key={promotion.id} className="panel p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">
                  {promotion.code}
                </p>
                <h3 className="mt-3 text-xl font-semibold">{promotion.title}</h3>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  {promotion.description}
                </p>
                <p className="mt-4 text-sm font-medium">
                  -{promotion.discountPercent}%{" "}
                  {promotion.productId
                    ? "sur ce produit"
                    : promotion.categoryId
                      ? `sur ${categoryMap.get(promotion.categoryId)?.name ?? "une categorie"}`
                      : "sur la selection"}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Produits vedettes</p>
            <h2 className="mt-2 text-3xl font-semibold">Selection de lancement</h2>
          </div>
          <Link href="/catalog" className="chip">
            Voir tout le catalogue
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {featuredProducts.slice(0, 3).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categoryName={categoryMap.get(product.categoryId)?.name}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-6">
          <p className="eyebrow">Tunnel client</p>
          <h2 className="mt-2 text-3xl font-semibold">
            Un parcours simple pour vendre vite
          </h2>
          <div className="mt-6 space-y-5">
            {[
              "1. Le client decouvre les parfums, filtre les categories et ouvre les fiches produit.",
              "2. Il ajoute plusieurs articles au panier sans creer de friction ni exposer de donnees sensibles.",
              "3. Au moment du paiement, le site le redirige vers WhatsApp officiel pour confirmer Mobile Money ou Orange Money.",
            ].map((item) => (
              <p
                key={item}
                className="rounded-[24px] border border-[color:var(--line)] bg-white px-4 py-4 text-sm text-[color:var(--muted)]"
              >
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <p className="eyebrow">Produits les mieux notes</p>
          <h2 className="mt-2 text-3xl font-semibold">
            Ce que voit immediatement un nouveau client
          </h2>
          <div className="mt-6 grid gap-4">
            {topRatedProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-4 rounded-[24px] border border-[color:var(--line)] bg-white px-5 py-4"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    Top {index + 1}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{product.name}</p>
                  <p className="text-sm text-[color:var(--muted)]">
                    {product.shortDescription}
                  </p>
                </div>
                <strong className="text-xl">{product.rating.toFixed(1)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
