import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductViewTracker } from "@/components/ui/product-view-tracker";
import { ProductCard } from "@/components/ui/product-card";
import { RatingStars } from "@/components/ui/rating-stars";
import { ZoomRotateViewer } from "@/components/ui/zoom-rotate-viewer";
import { buildCategoryMap, buildProductSlugMap } from "@/lib/catalog";
import { getCatalogSnapshot } from "@/lib/catalog-server";
import { formatPrice } from "@/lib/format";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { categories, products } = await getCatalogSnapshot();
  const productSlugMap = buildProductSlugMap(products);
  const categoryMap = buildCategoryMap(categories);
  const product = productSlugMap.get(slug);

  if (!product || product.status !== "active") {
    notFound();
  }

  const category = categoryMap.get(product.categoryId);
  const relatedProducts = products
    .filter(
      (entry) =>
        entry.categoryId === product.categoryId &&
        entry.id !== product.id &&
        entry.status === "active",
    )
    .slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <ProductViewTracker productId={product.id} />
        <ZoomRotateViewer images={product.gallery} alt={product.name} />

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip">{category?.name ?? "Produit"}</span>
              <span className="text-sm text-[color:var(--muted)]">
                {product.stockLabel}
              </span>
              {product.badge ? <span className="chip">{product.badge}</span> : null}
            </div>
            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
              {product.name}
            </h1>
            <p className="mt-2 text-lg text-[color:var(--muted)]">
              {product.brand ? `${product.brand} - ` : ""}
              {product.shortDescription}
            </p>
            {product.volumeLabel ? (
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {product.volumeLabel}
              </p>
            ) : null}
          </div>

          <RatingStars rating={product.rating} reviewCount={product.reviewCount} />

          <p className="text-base leading-8 text-[color:var(--muted)]">
            {product.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <strong className="text-3xl">
              {formatPrice(product.priceCents, product.currency)}
            </strong>
            <AddToCartButton productId={product.id} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
              <p className="eyebrow">Paiement</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Mobile Money ou Orange Money, valide apres echange sur WhatsApp.
              </p>
            </div>
            <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5">
              <p className="eyebrow">Vision produit</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Zoom, dezoom, rotation et vues multiples sont deja integres pour
                mieux inspecter le visuel.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/cart" className="btn-secondary">
              Voir le panier
            </Link>
            <Link href="/checkout" className="btn-primary">
              Passer au paiement
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="eyebrow">Meme univers</p>
          <h2 className="mt-2 text-3xl font-semibold">Produits lies</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {relatedProducts.map((entry) => (
            <ProductCard
              key={entry.id}
              product={entry}
              categoryName={categoryMap.get(entry.categoryId)?.name}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
