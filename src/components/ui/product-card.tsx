import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { RatingStars } from "@/components/ui/rating-stars";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

export function ProductCard({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
}) {
  return (
    <article className="panel overflow-hidden">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-[28px] bg-[color:var(--card-soft)] p-4">
          <div className="absolute inset-x-6 top-4 h-16 rounded-full bg-white/50 blur-3xl" />
          <Image
            src={product.heroImage}
            alt={product.name}
            width={560}
            height={560}
            className="relative h-72 w-full object-contain transition duration-500 hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="chip">{categoryName ?? "Produit"}</span>
          <span className="text-sm text-[color:var(--muted)]">{product.stockLabel}</span>
        </div>

        <div>
          {product.badge ? (
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
              {product.badge}
            </p>
          ) : null}
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-xl font-semibold transition hover:text-[color:var(--accent-strong)]">
              {product.name}
            </h3>
          </Link>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {product.shortDescription}
          </p>
          {product.volumeLabel ? (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
              {product.volumeLabel}
            </p>
          ) : null}
        </div>

        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />

        <div className="flex items-center justify-between gap-3">
          <strong className="text-lg">
            {formatPrice(product.priceCents, product.currency)}
          </strong>
          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </article>
  );
}
