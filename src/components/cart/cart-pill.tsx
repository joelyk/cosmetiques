"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";

export function CartPill() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className="chip inline-flex items-center gap-2">
      <ShoppingBag className="h-4 w-4" />
      Panier
      <span className="rounded-full bg-[color:var(--ink)]/90 px-2 py-0.5 text-xs text-white">
        {totalItems}
      </span>
    </Link>
  );
}
