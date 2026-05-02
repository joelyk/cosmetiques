import Link from "next/link";

import { ProductCard } from "@/components/ui/product-card";
import { searchProducts } from "@/lib/catalog";
import { getCatalogSnapshot } from "@/lib/catalog-server";

type CatalogPageProps = {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { category, q } = await searchParams;
  const { categories, products, promotions } = await getCatalogSnapshot();
  const visibleCategories = categories.filter((entry) => entry.isActive);
  const activeCategory = visibleCategories.find((entry) => entry.id === category);
  const filteredProducts = searchProducts(products, q, category);
  const activePromotions = promotions.filter((promotion) => promotion.isActive);
  const categoryMap = new Map(categories.map((entry) => [entry.id, entry]));

  return (
    <div className="space-y-10">
      <section className="panel p-6 md:p-8">
        <p className="eyebrow">Catalogue</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold">Tous les produits</h1>
            <p className="mt-3 max-w-2xl text-sm text-[color:var(--muted)]">
              La structure de recherche et de categories est deja prete pour
              evoluer au-dela des parfums.
            </p>
          </div>
          <form className="flex w-full max-w-xl flex-wrap gap-3 md:flex-nowrap">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Rechercher un produit, une marque ou un tag"
              className="field-input min-w-0 flex-1"
            />
            <select
              name="category"
              defaultValue={category ?? ""}
              className="field-input w-full md:w-56"
            >
              <option value="">Toutes les categories</option>
              {visibleCategories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Filtrer
            </button>
          </form>
        </div>
      </section>

      {activePromotions.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-3">
          {activePromotions.slice(0, 3).map((promotion) => (
            <article key={promotion.id} className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">
                {promotion.code}
              </p>
              <h2 className="mt-3 text-xl font-semibold">{promotion.title}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {promotion.description}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/catalog" className={`chip ${!category ? "chip-active" : ""}`}>
          Tout
        </Link>
        {visibleCategories.map((entry) => (
          <Link
            key={entry.id}
            href={`/catalog?category=${entry.id}`}
            className={`chip ${entry.id === category ? "chip-active" : ""}`}
          >
            {entry.name}
          </Link>
        ))}
      </div>

      {activeCategory ? (
        <section className="rounded-[32px] border border-[color:var(--line)] bg-white px-6 py-5">
          <p className="text-sm font-medium">{activeCategory.name}</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {activeCategory.description}
          </p>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categoryName={categoryMap.get(product.categoryId)?.name}
          />
        ))}
      </section>

      {filteredProducts.length === 0 ? (
        <section className="panel p-8">
          <h2 className="text-2xl font-semibold">Aucun produit trouve</h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">
            Essaie un autre mot-cle ou retire le filtre actif.
          </p>
        </section>
      ) : null}
    </div>
  );
}
